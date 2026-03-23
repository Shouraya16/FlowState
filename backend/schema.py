from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from pydantic import BaseModel
import enum

from database import Base


# =========================================================
# ENUM DEFINITIONS
# =========================================================

class UserType(enum.Enum):
    CLIENT = "CLIENT"
    ADMIN = "ADMIN"
    EMPLOYEE = "EMPLOYEE"


class EmployeeType(enum.Enum):
    MANAGER = "MANAGER"
    DEVELOPER = "DEVELOPER"
    TESTER = "TESTER"
    DESIGNER = "DESIGNER"


class RequestStatus(enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class TaskStatus(enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    READY_FOR_QA = "READY_FOR_QA"   # ← added
    DONE = "DONE"


class TaskPriority(enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class FeatureRequestCreate(BaseModel):
    title: str
    description: str


# =========================================================
# 1. BASE USER TABLE
# =========================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    user_type = Column(Enum(UserType), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    client_profile = relationship("Client", back_populates="user", uselist=False, cascade="all, delete")
    admin_profile = relationship("Admin", back_populates="user", uselist=False, cascade="all, delete")
    employee_profile = relationship("Employee", back_populates="user", uselist=False, cascade="all, delete")
    logs = relationship("AuditLog", back_populates="user")


# =========================================================
# 2. DIRECT SUBCLASSES OF USER
# =========================================================

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company_name = Column(String(255), nullable=False)

    user = relationship("User", back_populates="client_profile")
    requests = relationship("FeatureRequest", back_populates="client", cascade="all, delete-orphan")


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    access_level = Column(Integer, default=1)

    user = relationship("User", back_populates="admin_profile")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    emp_id = Column(String(50), unique=True, nullable=False, index=True)
    department = Column(String(100))
    employee_type = Column(Enum(EmployeeType), nullable=False)

    user = relationship("User", back_populates="employee_profile")
    assigned_tasks = relationship("Task", back_populates="assignee")
    manager_profile = relationship("Manager", back_populates="employee", uselist=False)
    developer_profile = relationship("Developer", back_populates="employee", uselist=False)
    tester_profile = relationship("Tester", back_populates="employee", uselist=False)
    designer_profile = relationship("Designer", back_populates="employee", uselist=False)


# =========================================================
# 3. EMPLOYEE SUBCLASSES
# =========================================================

class Manager(Base):
    __tablename__ = "managers"

    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    team_size = Column(Integer, default=0)

    employee = relationship("Employee", back_populates="manager_profile")


class Developer(Base):
    __tablename__ = "developers"

    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    skill_set = Column(String(255))
    active_ticket_count = Column(Integer, default=0)

    employee = relationship("Employee", back_populates="developer_profile")


class Tester(Base):
    __tablename__ = "testers"

    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    automation_tools = Column(String(255))

    employee = relationship("Employee", back_populates="tester_profile")


class Designer(Base):
    __tablename__ = "designers"

    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    portfolio_url = Column(String(255))

    employee = relationship("Employee", back_populates="designer_profile")


# =========================================================
# 4. BUSINESS LOGIC ENTITIES
# =========================================================

class FeatureRequest(Base):
    __tablename__ = "feature_requests"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(Enum(RequestStatus), default=RequestStatus.PENDING, index=True)
    submission_date = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="requests")
    tasks = relationship("Task", back_populates="feature_request", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("feature_requests.id", ondelete="CASCADE"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO, index=True)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM, index=True)
    git_branch = Column(String(255))

    feature_request = relationship("FeatureRequest", back_populates="tasks")
    assignee = relationship("Employee", back_populates="assigned_tasks")


# =========================================================
# 5. SYSTEM LOGS
# =========================================================

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    action_type = Column(String(100), nullable=False)
    details = Column(JSONB)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="logs")