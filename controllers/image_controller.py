from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import uuid
from fastapi.responses import JSONResponse

router = APIRouter()

UPLOAD_DIR = "storage/uploads"

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)

    # 生成一个唯一的文件名
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")

    # 返回可访问的URL
    file_url = f"/{UPLOAD_DIR}/{unique_filename}"
    
    # wangeditor 需要的特定返回格式
    return JSONResponse(content={
        "errno": 0,
        "data": {
            "url": file_url,
            "alt": unique_filename,
            "href": ""
        }
    })