from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import hashlib
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security config
SECRET_KEY = "fYsYs2Y4M4rPAiqF6CnWJ2Vm3WBNk32JSF5Npr8d3Ho"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer(auto_error=False)

def get_password_hash(password: str) -> str:
    """Hash a password using SHA-256"""
    salt = "fixed_salt_for_demo"
    return hashlib.sha256(f"{password}{salt}".encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return get_password_hash(plain_password) == hashed_password

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    logger.info(f"Created token for user {data.get('sub')}, expires at {expire}")
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verify JWT token and return payload"""
    logger.info("=== Token Verification Started ===")
    
    if not credentials:
        logger.error("No credentials provided in request")
        raise HTTPException(
            status_code=403,
            detail="Not authenticated - no token provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    logger.info(f"Token received: {token[:30]}...")  # Log first 30 chars
    
    try:
        # Decode token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.info(f"Token decoded successfully. Payload: {payload}")
        
        # Check expiration
        exp = payload.get("exp")
        if exp:
            exp_time = datetime.fromtimestamp(exp)
            now = datetime.utcnow()
            logger.info(f"Token expires at: {exp_time}, Current time: {now}")
            if now > exp_time:
                logger.error(f"Token expired at {exp_time}")
                raise HTTPException(
                    status_code=403,
                    detail="Token has expired",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        
        logger.info(f"Token verified successfully for user: {payload.get('sub')}")
        return payload
        
    except jwt.ExpiredSignatureError:
        logger.error("Token has expired signature")
        raise HTTPException(
            status_code=403,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError as e:
        logger.error(f"JWT verification failed: {str(e)}")
        raise HTTPException(
            status_code=403,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Unexpected error in token verification: {str(e)}")
        raise HTTPException(
            status_code=403,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )