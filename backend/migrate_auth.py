"""
migrate_auth.py - Adds auth fields to the users table
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import engine
from sqlalchemy import text

def run():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE"))
            conn.execute(text("ALTER TABLE users ADD COLUMN verification_token VARCHAR(100) NULL"))
            conn.execute(text("ALTER TABLE users ADD COLUMN reset_token VARCHAR(100) NULL"))
            conn.execute(text("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME NULL"))
            conn.commit()
            print("[OK] Added auth fields to users table.")
        except Exception as e:
            print(f"[WARN] Error altering users table: {e}")

if __name__ == "__main__":
    run()
