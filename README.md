# LexiSearch Dictionary API

A dictionary backend built with FastAPI and PostgreSQL.

## Features

- User Authentication (Register/Login)
- JWT Token Security
- Word Search API
- External Dictionary API Integration
- AI Example Sentence Generator
- Database Caching
- Swagger API Documentation

## Tech Stack

- FastAPI
- PostgreSQL
- SQLAlchemy (Async)
- HTTPX
- JWT Authentication

## API Endpoints

### Authentication
POST /auth/register  
POST /auth/login  

### Dictionary
GET /words/search/{word}

### AI
GET /ai/example/{word}

## Run Locally

Install dependencies
