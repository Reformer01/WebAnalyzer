from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, Float, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    analyses = relationship("Analysis", back_populates="user")

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, index=True)
    final_url = Column(String)
    title = Column(String)
    status_code = Column(Integer)
    processing_time = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Analysis results stored as JSON
    metadata = Column(JSON)
    links = Column(JSON)
    images = Column(JSON)
    content = Column(JSON)
    headings = Column(JSON)
    stats = Column(JSON)
    ai_insights = Column(JSON)

    # Settings used for analysis
    analysis_settings = Column(JSON)

    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="analyses")
