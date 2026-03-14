from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "mysql+pymysql://root:root@localhost:3306/dynamic_pricing"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(bind=engine)