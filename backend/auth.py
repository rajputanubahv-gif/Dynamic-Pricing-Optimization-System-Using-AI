import hashlib
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "secretkey"
ALGORITHM = "HS256"


def hash_password(password):

    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password, hashed):

    return hashlib.sha256(password.encode()).hexdigest() == hashed


def create_token(data):

    expire = datetime.utcnow() + timedelta(hours=2)

    data.update({"exp": expire})

    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    from jose import JWTError
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None