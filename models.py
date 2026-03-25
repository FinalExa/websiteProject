from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class UserData(db.Model):
    username = db.Column(db.String(100), primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    password = db.Column(db.Text, nullable=False)
    is_verified = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f'<User {self.username}>'