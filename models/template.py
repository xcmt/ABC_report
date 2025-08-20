from sqlalchemy import Column, Integer, String, Text
from .database import Base

class VulnerabilityTemplate(Base):
    __tablename__ = "vulnerability_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    test_guide = Column(Text, nullable=True)
    risk_level = Column(String, default="中")
    recommendation = Column(Text, nullable=True)
from sqlalchemy import Column, Integer, String, Text, JSON
from .database import Base

class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    filepath = Column(String, unique=True)
    placeholders = Column(JSON)
