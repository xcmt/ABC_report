from fastapi import APIRouter, Depends, HTTPException
from services import ai_service

router = APIRouter(
    prefix="/api/ai",
    tags=["ai"],
)

@router.post("/test-config")
async def test_ai_config():
    """
    测试AI API配置的有效性。
    """
    result = await ai_service.test_ai_connection()
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result
