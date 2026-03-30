from database import SessionLocal
from models import User
from datetime import datetime

db = SessionLocal()
users = db.query(User).all()

print(f"{'ID':<5} | {'Email':<25} | {'Reset Token':<35} | {'Expires (UTC)':<20} | {'Status'}")
print("-" * 100)

now = datetime.utcnow()

for u in users:
    expiry_str = str(u.reset_token_expires) if u.reset_token_expires else "None"
    status = "VALID"
    tok_repr = repr(u.reset_token) # Shows hidden chars
    if not u.reset_token:
        status = "MISSING"
    elif u.reset_token_expires and u.reset_token_expires < now:
        status = "EXPIRED"
        
    print(f"{u.id:<5} | {u.email:<25} | {tok_repr:<45} | {expiry_str:<20} | {status}")

db.close()
print(f"\nCurrent UTC time: {now}")
