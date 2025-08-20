import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from models import report, template, database
from controllers import vulnerability_template_controller, report_controller, docx_template_controller, image_controller, ai_controller
from sqlalchemy.orm import Session

# 创建数据库表
database.Base.metadata.create_all(bind=database.engine)

# 创建 FastAPI 应用实例
app = FastAPI(
    title="渗透测试报告自动生成工具",
    description="一个基于DOCX模板，快速生成渗透测试报告的轻量级工具。",
    version="1.0.0",
)

# 应用启动时执行的事件

# 包含API路由
app.include_router(vulnerability_template_controller.router)
app.include_router(report_controller.router)
app.include_router(docx_template_controller.router)
app.include_router(image_controller.router, prefix="/api/images", tags=["images"])
app.include_router(ai_controller.router)

# 根路由，用于健康检查或基本信息展示
@app.get("/api") # 将API根路径移到/api下，避免与前端冲突
async def root():
    return {"message": "欢迎使用渗透测试报告自动生成工具API"}

# 关键修正：为截图目录创建一个专门的挂载点，确保能被访问
# 这个必须在根挂载点之前声明，以获得更高的匹配优先级
app.mount("/static/screenshots", StaticFiles(directory="static/screenshots"), name="screenshots")

# 挂载 storage 目录，用于提供生成的报告下载和图片访问
# 关键修复：确保 /storage 路由在根路由 / 之前被注册
app.mount("/storage", StaticFiles(directory="storage"), name="storage")

# 挂载静态文件目录，用于托管前端Vue应用
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    # 使用 uvicorn 启动服务，便于开发调试
    # host="0.0.0.0" 让服务可以被局域网访问
    # reload=True 会在代码变更后自动重启服务
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)