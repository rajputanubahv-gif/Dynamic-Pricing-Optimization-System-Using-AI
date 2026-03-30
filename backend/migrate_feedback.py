import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

# Extract database credentials from DATABASE_URL
# URL format: mysql+pymysql://root:root@localhost:3306/dynamic_pricing
db_url = os.getenv("DATABASE_URL", "mysql+pymysql://root:root@localhost:3306/dynamic_pricing")

# Simple parsing for the script
try:
    # Remove the driver prefix
    clean_url = db_url.replace("mysql+pymysql://", "")
    # Split into auth and host/db
    auth, rest = clean_url.split("@")
    user, password = auth.split(":")
    # Split host:port and db
    host_port, db_name = rest.split("/")
    if ":" in host_port:
        host, port = host_port.split(":")
        port = int(port)
    else:
        host = host_port
        port = 3306

    print(f"Connecting to host={host}, port={port}, user={user}, db={db_name}...")

    connection = pymysql.connect(
        host=host,
        user=user,
        password=password,
        database=db_name,
        port=port
    )
    cursor = connection.cursor()

    print(f"Connected to {db_name}. Running migration...")

    # Add columns if they don't exist
    columns_to_add = [
        ("category", "VARCHAR(50) DEFAULT 'Pricing'"),
        ("sentiment", "VARCHAR(20) DEFAULT 'Neutral'"),
        ("is_accurate", "BOOLEAN DEFAULT TRUE")
    ]

    for col_name, col_def in columns_to_add:
        try:
            # Check if column exists first (safer approach)
            cursor.execute(f"SHOW COLUMNS FROM user_feedback LIKE '{col_name}'")
            result = cursor.fetchone()
            if not result:
                cursor.execute(f"ALTER TABLE user_feedback ADD COLUMN {col_name} {col_def}")
                print(f"SUCCESS: Added column: {col_name}")
            else:
                print(f"INFO: Column '{col_name}' already exists. Skipping.")
        except Exception as e:
            print(f"ERROR adding {col_name}: {e}")

    connection.commit()
    print("Database Migration SUCCESSFUL! 🛡️ ✦")

except Exception as ex:
    print(f"CRITICAL: Migration failed: {ex}")
finally:
    if 'connection' in locals():
        connection.close()
