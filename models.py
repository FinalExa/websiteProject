from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class UserData(db.Model):
    username = db.Column(db.String(100), primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    password = db.Column(db.Text, nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    profile_pic_path = db.Column(db.String(255), nullable=True)
    posts = db.relationship('UserPost', backref='author', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'

class UserPost(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    # Added timestamp
    date_posted = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    user_username = db.Column(db.String(100), db.ForeignKey('user_data.username'), nullable=False)

    def __repr__(self):
        return f'<Post {self.id} by {self.user_username}>'