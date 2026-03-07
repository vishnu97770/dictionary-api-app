from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from passlib.context import CryptContext

from app.models.user import User
from app.schemas.auth import UserRegister

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:

    @staticmethod
    async def register_user(db: AsyncSession, user_data: UserRegister):

        hashed_password = pwd_context.hash(user_data.password)

        user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password
        )

        db.add(user)
        await db.commit()
        await db.refresh(user)

        return user