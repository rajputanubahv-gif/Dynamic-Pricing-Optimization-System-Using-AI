from database import engine
from models import Base, User, Prediction, UserFeedback, TrainingRecord, SystemConfig

print("Dropping all tables...")
Base.metadata.drop_all(bind=engine)

print("Creating all tables...")
Base.metadata.create_all(bind=engine)

print("Database rebuilt successfully!")
