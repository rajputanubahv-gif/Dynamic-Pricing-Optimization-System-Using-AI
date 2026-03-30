"""
migrate_add_user_id.py — One-time migration to add user_id to the predictions table,
and create the new user_feedback and training_records tables.

Run with:
    D:\\Project\\dynamic-pricing-system\\backend\\.venv\\Scripts\\python.exe migrate_add_user_id.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import engine
from sqlalchemy import text


def run():
    with engine.connect() as conn:
        # 1. Add user_id column to predictions if not already present
        try:
            conn.execute(text(
                "ALTER TABLE predictions ADD COLUMN user_id INT NULL, "
                "ADD CONSTRAINT fk_pred_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL"
            ))
            conn.commit()
            print("[OK] Added user_id column to predictions table.")
        except Exception as e:
            if "Duplicate column" in str(e) or "1060" in str(e):
                print("[SKIP] user_id column already exists in predictions.")
            else:
                print(f"[WARN] Could not add user_id: {e}")

        # 2. Create user_feedback table
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS user_feedback (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    prediction_id INT NULL,
                    user_id INT NOT NULL,
                    actual_price FLOAT NOT NULL,
                    rating INT NULL,
                    comment TEXT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_fb_pred FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE SET NULL,
                    CONSTRAINT fk_fb_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """))
            conn.commit()
            print("[OK] user_feedback table ready.")
        except Exception as e:
            print(f"[WARN] user_feedback: {e}")

        # 3. Create training_records table
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS training_records (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    triggered_by INT NULL,
                    samples_used INT NOT NULL,
                    model_score FLOAT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_tr_user FOREIGN KEY (triggered_by) REFERENCES users(id) ON DELETE SET NULL
                )
            """))
            conn.commit()
            print("[OK] training_records table ready.")
        except Exception as e:
            print(f"[WARN] training_records: {e}")

    print("\nMigration complete.")


if __name__ == "__main__":
    run()
