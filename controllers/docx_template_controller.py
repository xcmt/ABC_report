from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os

import schemas
from services import docx_template_service
from models import database

router = APIRouter(
    prefix="/api/templates",
    tags=["docx-templates"],
)

UPLOAD_DIR = "storage/templates"

@router.post("/upload", response_model=schemas.TemplateResponse)
async def upload_template(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
        
    template = docx_template_service.create_docx_template(db, name=file.filename, file_path=file_path)
    return template

@router.get("/", response_model=List[schemas.TemplateResponse])
def read_templates(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    templates = docx_template_service.get_docx_templates(db, skip=skip, limit=limit)
    return templates

@router.get("/{template_id}", response_model=schemas.TemplateResponse)
def read_template(template_id: int, db: Session = Depends(database.get_db)):
    db_template = docx_template_service.get_docx_template(db, template_id=template_id)
    if db_template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return db_template

@router.delete("/{template_id}", response_model=schemas.MessageResponse)
def delete_template(template_id: int, db: Session = Depends(database.get_db)):
    docx_template_service.delete_docx_template(db, template_id=template_id)
    return {"message": "Template deleted successfully"}