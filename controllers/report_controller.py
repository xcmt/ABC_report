from typing import List
import os
import traceback
from urllib.parse import quote
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from services import report_service
from models import database
from schemas import ReportCreate, ReportUpdate, ReportResponse, MessageResponse

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"],
)

@router.post("/", response_model=ReportResponse)
async def create_report(report: ReportCreate, db: Session = Depends(database.get_db)):
    """
    创建一份新的渗透测试报告。
    需要提供项目基础信息，以及一个可选的漏洞列表。
    """
    return report_service.create_report(db=db, report=report)

@router.get("/", response_model=List[ReportResponse])
async def list_reports(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """
    获取所有报告的列表，支持分页。
    """
    reports = report_service.get_reports(db, skip=skip, limit=limit)
    return [ReportResponse.from_orm(r) for r in reports]

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: int, db: Session = Depends(database.get_db)):
    """
    根据ID获取单个报告的详细信息，包括所有关联的漏洞。
    """
    db_report = report_service.get_report(db=db, report_id=report_id)
    return ReportResponse.from_orm(db_report)

@router.put("/{report_id}", response_model=ReportResponse)
async def update_report(report_id: int, report: ReportUpdate, db: Session = Depends(database.get_db)):
    """
    根据ID更新一份报告的全部内容。
    """
    return report_service.update_report(db=db, report_id=report_id, report=report)

@router.delete("/{report_id}", response_model=MessageResponse)
async def delete_report(report_id: int, db: Session = Depends(database.get_db)):
    """
    根据ID删除一份报告及其所有关联的漏洞。
    """
    return report_service.delete_report(db=db, report_id=report_id)

@router.post("/{report_id}/screenshots") # 移除 response_model，因为我们需要返回一个自定义结构
async def upload_screenshot_for_report(report_id: int, file: UploadFile = File(...)):
    """
    为指定的报告上传一张截图。
    返回截图的唯一键和可访问的文件路径。
    """
    result = report_service.upload_screenshot(report_id=report_id, file=file)
    print(f"--- DEBUG: Image uploaded. Filepath returned to frontend: {result['filepath']} ---")
    # 返回一个同时包含 message 和 filepath 的自定义对象，以满足前端需求
    return {
        "message": f"Screenshot {result['screenshot_key']} uploaded successfully.",
        "filepath": result['filepath']
    }

@router.post("/{report_id}/generate/{template_id}", response_class=FileResponse)
async def generate_report(report_id: int, template_id: int, db: Session = Depends(database.get_db)):
    """
    使用指定模板生成报告，并直接返回DOCX文件流供下载。
    """
    try:
        # 服务层现在返回生成的文件的物理路径
        file_path = report_service.generate_report_docx(db, report_id, template_id)
        
        # 从报告数据中获取文件名
        db_report = report_service.get_report(db, report_id)
        company_short_name = db_report.report_center_short or ''
        system_name = db_report.report_systemname or ''
        friendly_filename = f"{company_short_name}{system_name}渗透测试报告.docx"

        # 手动构建 Content-Disposition 响应头，确保中文文件名被正确编码
        headers = {
            'Content-Disposition': f"attachment; filename*=UTF-8''{quote(friendly_filename)}"
        }
        return FileResponse(path=file_path, headers=headers, media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"报告生成失败: {str(e)}")