from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:root@localhost:3306/dynamic_pricing")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Checking for verification_token_expires column...")
    # Check if column exists (MySQL specific)
    result = conn.execute(text("SHOW COLUMNS FROM users LIKE 'verification_token_expires'"))
    if not result.fetchone():
        print("Adding column 'verification_token_expires' to 'users' table...")
        conn.execute(text("ALTER TABLE users ADD COLUMN verification_token_expires DATETIME NULL AFTER verification_token"))
        conn.commit()
        print("Column added successfully.")
    else:
        print("Column already exists. Skipping.")

print("Migration complete.")
