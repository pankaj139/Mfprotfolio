from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Fund(Base):
    __tablename__ = "funds"

    id = Column(Integer, primary_key=True, index=True)
    scheme_code = Column(String, unique=True, index=True)
    scheme_name = Column(String, nullable=False)
    amc = Column(String)
    category = Column(String)
    sub_category = Column(String)
    benchmark = Column(String)
    fund_manager = Column(String)
    inception_date = Column(String)
    objective = Column(Text)
    isin_growth = Column(String)
    added_at = Column(DateTime, default=datetime.utcnow)

    holdings = relationship("HoldingSnapshot", back_populates="fund", cascade="all, delete-orphan")
    sectors = relationship("SectorSnapshot", back_populates="fund", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="fund", cascade="all, delete-orphan")
    metadata_history = relationship("FundMetadata", back_populates="fund", cascade="all, delete-orphan")


class HoldingSnapshot(Base):
    __tablename__ = "holding_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    fund_id = Column(Integer, ForeignKey("funds.id"), nullable=False)
    snapshot_month = Column(String, nullable=False)  # YYYY-MM
    stock_name = Column(String, nullable=False)
    sector = Column(String)
    weightage = Column(Float, nullable=False)

    fund = relationship("Fund", back_populates="holdings")


class SectorSnapshot(Base):
    __tablename__ = "sector_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    fund_id = Column(Integer, ForeignKey("funds.id"), nullable=False)
    snapshot_month = Column(String, nullable=False)  # YYYY-MM
    sector_name = Column(String, nullable=False)
    weightage = Column(Float, nullable=False)

    fund = relationship("Fund", back_populates="sectors")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    fund_id = Column(Integer, ForeignKey("funds.id"), nullable=False)
    alert_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String, default="MEDIUM")  # HIGH, MEDIUM, LOW
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    fund = relationship("Fund", back_populates="alerts")


class FundMetadata(Base):
    __tablename__ = "fund_metadata"

    id = Column(Integer, primary_key=True, index=True)
    fund_id = Column(Integer, ForeignKey("funds.id"), nullable=False)
    category = Column(String)
    sub_category = Column(String)
    fund_manager = Column(String)
    objective = Column(Text)
    benchmark = Column(String)
    asset_equity = Column(Float)
    asset_debt = Column(Float)
    asset_cash = Column(Float)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    fund = relationship("Fund", back_populates="metadata_history")
