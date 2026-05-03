from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine, SessionLocal
from models import Fund, HoldingSnapshot, SectorSnapshot, Alert, FundMetadata  # noqa: F401 — ensure models are registered
from services.seed_service import seed_database
from routers import portfolio, holdings, sectors, performance, alerts, news, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="MF Portfolio Intelligence API",
    description="Mutual Fund Portfolio Monitoring & Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(portfolio.router, prefix="/api/portfolio", tags=["Portfolio"])
app.include_router(holdings.router, prefix="/api/holdings", tags=["Holdings"])
app.include_router(sectors.router, prefix="/api/sectors", tags=["Sectors"])
app.include_router(performance.router, prefix="/api/performance", tags=["Performance"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(news.router, prefix="/api/news", tags=["News"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])


@app.get("/health")
def health():
    return {"status": "ok"}
