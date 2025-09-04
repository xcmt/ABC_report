from pydantic import BaseModel
from typing import List, Optional
import datetime

# --- 基础响应模型 ---
class MessageResponse(BaseModel):
    message: str

# --- 模板相关的模型 ---
class TemplateResponse(BaseModel):
    id: int
    name: str
    filepath: str
    placeholders: dict

    class Config:
        from_attributes = True

# --- 报告和漏洞相关的模型 ---
class VulnerabilityBase(BaseModel):
    vul_name: Optional[str] = None
    vul_level: Optional[str] = None
    vul_describe: Optional[str] = None
    vul_url: Optional[str] = None
    vul_analysis: Optional[str] = None
    vul_modify_repair: Optional[str] = None

class VulnerabilityCreate(VulnerabilityBase):
    pass

class VulnerabilityResponse(VulnerabilityBase):
    id: int
    class Config:
        orm_mode = True

class TargetBase(BaseModel):
    name: str
    url: str

class TargetCreate(TargetBase):
    pass

class TargetResponse(TargetBase):
    id: int
    class Config:
        orm_mode = True

class MemberBase(BaseModel):
    role: str
    name: str
    contact: str

class MemberCreate(MemberBase):
    pass

class MemberResponse(MemberBase):
    id: int
    class Config:
        orm_mode = True

class ReportBase(BaseModel):
    report_center: Optional[str] = None
    report_systemname: Optional[str] = None
    report_start_time: Optional[str] = None
    report_end_time: Optional[str] = None
    author: Optional[str] = None
    reviewer: Optional[str] = None
    report_center_short: Optional[str] = None
    overall_risk_level: Optional[str] = None

class ReportCreate(ReportBase):
    vuls: List[VulnerabilityCreate] = []
    targets: List[TargetCreate] = []
    members: List[MemberCreate] = []

class ReportUpdate(ReportCreate):
    pass

class ReportResponse(ReportBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    vuls: List[VulnerabilityResponse] = []
    targets: List[TargetResponse] = []
    members: List[MemberResponse] = []
    class Config:
        orm_mode = True

# --- AI 生成相关 ---
class VulnerabilityGenerationRequest(BaseModel):
   vuln_name: str

class VulnerabilityGenerationResponse(BaseModel):
   description: str
   recommendation: str

# --- 漏洞知识库模板 ---
class VulnerabilityTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    test_guide: Optional[str] = None
    risk_level: Optional[str] = "中"
    recommendation: Optional[str] = None

class VulnerabilityTemplateCreate(VulnerabilityTemplateBase):
    pass

class VulnerabilityTemplateUpdate(VulnerabilityTemplateBase):
    pass

class VulnerabilityTemplateResponse(VulnerabilityTemplateBase):
    id: int

    class Config:
        orm_mode = True

class VulnerabilityTemplatePaginatedResponse(BaseModel):
    templates: List[VulnerabilityTemplateResponse]
    total: int
