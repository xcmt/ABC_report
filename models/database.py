import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 获取当前文件所在的目录
# __file__ 是当前脚本的路径
# os.path.dirname(__file__) 是当前脚本所在的目录
# os.path.abspath() 获取绝对路径
# os.path.join() 用于拼接路径
# '..' 用于返回上一级目录
# 最终，数据库文件将与 ABC_report 目录同级
DATABASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(DATABASE_DIR, 'report_generator.db')}"

# 创建数据库引擎
# connect_args={"check_same_thread": False} 是SQLite的特殊要求，允许多线程访问
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 创建数据库会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建一个Base类，我们的ORM模型将继承这个类
Base = declarative_base()

# 依赖项：获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()