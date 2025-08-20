import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_center = Column(String, nullable=True)
    report_systemname = Column(String, nullable=True)
    report_start_time = Column(String, nullable=True)
    report_end_time = Column(String, nullable=True)
    author = Column(String, nullable=True)
    reviewer = Column(String, nullable=True)
    report_center_short = Column(String, nullable=True)
    overall_risk_level = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    vuls = relationship("Vulnerability", back_populates="report", cascade="all, delete-orphan")
    targets = relationship("Target", back_populates="report", cascade="all, delete-orphan")
    members = relationship("Member", back_populates="report", cascade="all, delete-orphan")

class Vulnerability(Base):
    __tablename__ = "vulnerabilities"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"))
    
    vul_name = Column(String, index=True, nullable=True)
    vul_level = Column(String, nullable=True)
    vul_describe = Column(Text, nullable=True)
    vul_url = Column(String, nullable=True)
    vul_analysis = Column(Text, nullable=True)
    vul_modify_repair = Column(Text, nullable=True)

    report = relationship("Report", back_populates="vuls")

class Target(Base):
    __tablename__ = "targets"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"))
    name = Column(String)
    url = Column(String)
    report = relationship("Report", back_populates="targets")

class Member(Base):
    __tablename__ = "members"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"))
    role = Column(String)
    name = Column(String)
    contact = Column(String)
    report = relationship("Report", back_populates="members")