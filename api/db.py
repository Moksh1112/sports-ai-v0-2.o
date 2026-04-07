from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
from contextlib import contextmanager
import os


class Database:
    """MongoDB database handler"""

    def __init__(self, uri: str):
        self.client = None
        self.db = None
        self.uri = uri

    def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = MongoClient(self.uri, serverSelectionTimeoutMS=5000)

            # Verify connection
            self.client.admin.command('ping')

            # Get DB name safely
            db_name = self.client.get_default_database()
            if db_name is not None:
                self.db = db_name
            else:
                # fallback (change this if needed)
                self.db = self.client["test"]

            self._create_indexes()

            print("[v0] Connected to MongoDB successfully")
            return True

        except ServerSelectionTimeoutError:
            print("[v0] Failed to connect to MongoDB")
            return False

    def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client is not None:
            self.client.close()
            self.db = None
            self.client = None

    def _create_indexes(self):
        """Create indexes for collections"""
        if self.db is None:
            return

        # User indexes
        users = self.db['users']
        users.create_index('email', unique=True)
        users.create_index('username', unique=True)

        # Video indexes
        videos = self.db['videos']
        videos.create_index('user_id')
        videos.create_index('created_at')

        # Results indexes
        results = self.db['results']
        results.create_index('user_id')
        results.create_index('video_id')
        results.create_index('created_at')

        # Feedback indexes
        feedback = self.db['feedback']
        feedback.create_index('user_id')
        feedback.create_index('video_id')
        feedback.create_index('coach_id')
        feedback.create_index('created_at')

    def get_collection(self, name: str):
        """Get a collection"""
        if self.db is None:
            raise Exception("Database not connected")
        return self.db[name]

    @contextmanager
    def session(self):
        """Context manager for database operations"""
        try:
            yield self.db
        except Exception as e:
            print(f"[v0] Database error: {str(e)}")
            raise


# Global database instance
db_instance = None


def init_db(uri: str):
    """Initialize database"""
    global db_instance
    db_instance = Database(uri)
    db_instance.connect()
    return db_instance


def get_db():
    """Get database instance"""
    return db_instance