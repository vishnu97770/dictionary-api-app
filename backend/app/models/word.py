from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

from app.models.base import Base


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String, unique=True, index=True)
    phonetic = Column(String)
    definition = Column(String)


    