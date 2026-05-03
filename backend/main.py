from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine, SessionLocal
from models import User, Fund, HoldingSnapshot, SectorSnapshot, Alert, FundMetadata  # noqa: F401
from services.seed_service import seed_database
from auth import get_current_user
from routers import portfolio, holdings, sectors, performance, alerts, news, dashboard
from routers.auth_router import router as auth_router


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

# Public — no auth required
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])

# Protected — all routes below require a valid JWT
_auth = [Depends(get_current_user)]
app.include_router(portfolio.router,    prefix="/api/portfolio",    tags=["Portfolio"],    dependencies=_auth)
app.include_router(holdings.router,     prefix="/api/holdings",     tags=["Holdings"],     dependencies=_auth)
app.include_router(sectors.router,      prefix="/api/sectors",      tags=["Sectors"],      dependencies=_auth)
app.include_router(performance.router,  prefix="/api/performance",  tags=["Performance"],  dependencies=_auth)
app.include_router(alerts.router,       prefix="/api/alerts",       tags=["Alerts"],       dependencies=_auth)
app.include_router(news.router,         prefix="/api/news",         tags=["News"],         dependencies=_auth)
app.include_router(dashboard.router,    prefix="/api/dashboard",    tags=["Dashboard"],    dependencies=_auth)


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "version": "1.0.0"}
