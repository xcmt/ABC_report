from sqlalchemy.orm import Session
from models import template as models
import os
from docx import Document
import re

def get_placeholders_from_docx(file_path: str) -> dict:
    """
    从DOCX文件中解析普通变量、图片和循环块的占位符。
    """
    try:
        doc = Document(file_path)
        text = "\n".join([p.text for p in doc.paragraphs])
        
        # 匹配 {{variable}}
        variables = set(re.findall(r"\{\{([^}]+?)\}\}", text))
        variables.add('first_vul_name') # 手动添加后端生成的变量
        
        # 匹配 {% loop items %}...{% endloop %}
        loops = {}
        loop_matches = re.finditer(r"\{%\s*loop\s+([\w_]+)\s*%\}(.*?)\{%\s*endloop\s*%\}", text, re.DOTALL)
        for match in loop_matches:
            loop_name = match.group(1)
            loop_content = match.group(2)
            loop_vars = set(re.findall(r"\{\{([^}]+?)\}\}", loop_content))
            loops[loop_name] = {"vars": list(loop_vars)}
            # 从主变量列表中移除循环内部的变量
            variables -= loop_vars

        # 匹配图片占位符 (简化逻辑)
        images = set()

        return {
            "vars": list(variables),
            "images": list(images),
            "loops": loops
        }
    except Exception:
        # 如果解析失败，返回一个空的结构，避免应用崩溃
        return {"vars": [], "images": [], "loops": {}}

def get_docx_template(db: Session, template_id: int):
    return db.query(models.Template).filter(models.Template.id == template_id).first()

def get_docx_templates(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Template).offset(skip).limit(limit).all()

def create_docx_template(db: Session, name: str, file_path: str):
    placeholders = get_placeholders_from_docx(file_path)
    db_template = models.Template(name=name, filepath=file_path, placeholders=placeholders)
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

def delete_docx_template(db: Session, template_id: int):
    db_template = get_docx_template(db, template_id)
    if db_template:
        if os.path.exists(db_template.filepath):
            os.remove(db_template.filepath)
        db.delete(db_template)
        db.commit()
    return db_template