import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL", "mysql+pymysql://root:root@localhost:3306/dynamic_pricing")

try:
    clean_url = db_url.replace("mysql+pymysql://", "")
    auth, rest = clean_url.split("@")
    user, password = auth.split(":")
    host_port, db_name = rest.split("/")
    if ":" in host_port:
        host, port = host_port.split(":")
        port = int(port)
    else:
        host = host_port
        port = 3306

    connection = pymysql.connect(
        host=host,
        user=user,
        password=password,
        database=db_name,
        port=port
    )
    cursor = connection.cursor(pymysql.cursors.DictCursor)

    print("--- User Feedback Table Scan ---")
    cursor.execute("SELECT id, prediction_id, actual_price, rating, category, sentiment FROM user_feedback ORDER BY created_at DESC LIMIT 5")
    rows = cursor.fetchall()
    
    if not rows:
        print("No feedback records found.")
    else:
        for row in rows:
            print(row)

    print("\n--- Column Definitions ---")
    cursor.execute("DESCRIBE user_feedback")
    cols = cursor.fetchall()
    for col in cols:
        print(f"{col['Field']}: {col['Type']}")

except Exception as ex:
    print(f"Error: {ex}")
finally:
    if 'connection' in locals():
        connection.close()
