import os
import shutil
from docx import Document
from sqlalchemy.orm import Session, joinedload
from models import report as report_model, template as template_model
from fastapi import HTTPException, UploadFile
from schemas import ReportCreate
import datetime
from typing import List, Optional

# --- Helper Functions ---
def _calculate_overall_risk(vuls: List[report_model.Vulnerability]) -> str:
    """根据漏洞列表计算整体风险等级"""
    levels = {v.vul_level for v in vuls}
    if 'High' in levels:
        return '高危'
    if 'Medium' in levels:
        return '中危'
    if 'Low' in levels:
        return '低危'
    return '无风险'

# --- Service Functions ---

def create_report(db: Session, report: ReportCreate):
    """创建一份新报告及其所有相关数据"""
    # 注意：这里的 vuls 是 Pydantic 模型，需要先转换
    overall_risk_level = _calculate_overall_risk(report.vuls)

    db_report = report_model.Report(
        overall_risk_level=overall_risk_level,
        report_center=report.report_center,
        report_systemname=report.report_systemname,
        report_start_time=report.report_start_time,
        report_end_time=report.report_end_time,
        author=report.author,
        reviewer=report.reviewer,
        report_center_short=report.report_center_short,
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    for vuln_data in report.vuls:
        db_vuln = report_model.Vulnerability(**vuln_data.dict(), report_id=db_report.id)
        db.add(db_vuln)
        
    for target_data in report.targets:
        db_target = report_model.Target(**target_data.dict(), report_id=db_report.id)
        db.add(db_target)

    for member_data in report.members:
        db_member = report_model.Member(**member_data.dict(), report_id=db_report.id)
        db.add(db_member)
    
    db.commit()
    db.refresh(db_report)
    return db_report

def update_report(db: Session, report_id: int, report: ReportCreate):
    """更新一份报告及其所有相关数据"""
    # 在更新前就计算好新的风险等级
    overall_risk_level = _calculate_overall_risk(report.vuls)
    
    db_report = get_report(db, report_id)
    if not db_report:
        raise HTTPException(status_code=404, detail="报告不存在")

    # 更新报告主表字段
    for key, value in report.dict(exclude_unset=True).items():
        if hasattr(db_report, key) and key not in ["vuls", "targets", "members"]:
            setattr(db_report, key, value)
    
    # 更新计算出的整体风险等级
    db_report.overall_risk_level = overall_risk_level

    # 全量更新关联数据：先删除旧的，再创建新的
    db_report.vuls.clear()
    db_report.targets.clear()
    db_report.members.clear()

    # 关键修复：在添加新数据之前，先将删除操作刷新到数据库会话中
    # 这可以防止在同一事务中删除和添加相同关联对象时可能出现的冲突
    db.flush()

    for vuln_data in report.vuls:
        db_vuln = report_model.Vulnerability(**vuln_data.dict(), report_id=db_report.id)
        db.add(db_vuln)
        
    for target_data in report.targets:
        db_target = report_model.Target(**target_data.dict(), report_id=db_report.id)
        db.add(db_target)

    for member_data in report.members:
        db_member = report_model.Member(**member_data.dict(), report_id=db_report.id)
        db.add(db_member)

    db.commit()
    db.refresh(db_report)
    return db_report

def get_reports(db: Session, skip: int = 0, limit: int = 100):
    """获取报告列表"""
    return db.query(report_model.Report).offset(skip).limit(limit).all()

def get_report(db: Session, report_id: int):
    """获取单个报告的详细信息"""
    # 关键修复：使用 joinedload 预先加载关联数据，避免懒加载导致的会话问题
    db_report = db.query(report_model.Report).options(
        joinedload(report_model.Report.vuls),
        joinedload(report_model.Report.targets),
        joinedload(report_model.Report.members)
    ).filter(report_model.Report.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="报告不存在")
    return db_report

def delete_report(db: Session, report_id: int):
    """删除报告"""
    db_report = get_report(db, report_id)
    db.delete(db_report)
    db.commit()
    return {"message": "报告删除成功"}

def upload_screenshot(report_id: int, file: UploadFile):
    """上传截图并返回其访问路径或键"""
    # 修正：确保图片保存在可提供静态服务的目录下
    upload_dir = "static/screenshots"
    os.makedirs(upload_dir, exist_ok=True)
    
    # 生成一个更唯一的文件名，避免冲突
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    unique_filename = f"{timestamp}_{file.filename}"
    
    filepath = os.path.join(upload_dir, unique_filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 关键修正：返回一个浏览器可以访问的URL路径
    url_path = f"/{filepath}"
    return {"filepath": url_path, "screenshot_key": unique_filename}

from . import docx_render_service

def generate_report_docx(db: Session, report_id: int, template_id: int):
    """
    生成指定报告的DOCX文件。
    """
    report = get_report(db, report_id)
    template = db.query(template_model.Template).filter(template_model.Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")
        
    try:
        # render_docx 返回的是类似 'storage/generated/...' 的物理路径
        file_path = docx_render_service.render_docx(report, template)
        
        # 关键修复：直接返回这个相对于项目根目录的物理路径
        # controller 中的 FileResponse 会处理它
        return file_path
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"报告生成失败: {e}")