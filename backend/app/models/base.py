# Single source of truth for Base — re-exported from db.py
# This ensures all models register on the same metadata object
# so create_all() creates every table correctly.
from app.database.db import Base

__all__ = ["Base"]