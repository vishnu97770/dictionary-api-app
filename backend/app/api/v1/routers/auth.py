from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.db import get_db
from app.schemas.auth import UserRegister, UserLogin
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
async def register_user(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):

    user = await AuthService.register_user(db, user_data)

    return {
        "message": "User created successfully",
        "username": user.username,
        "email": user.email
    }



from fastapi import HTTPException
from sqlalchemy.future import select
from app.models.user import User
from app.core.security import pwd_context, create_access_token

@router.post("/login")
async def login_user(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not pwd_context.verify(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id)})

    return {
        "access_token": token,
        "token_type": "bearer"
    }

