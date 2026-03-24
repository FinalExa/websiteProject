import os
from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'project.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class UserMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    password = db.Column(db.Text, nullable=False)

    def __repr__(self):
        return f'<Message from {self.name}>'

# Main entry point for all URLs
@app.route('/')
@app.route('/home')
@app.route('/about')
@app.route('/contact')
@app.route('/user')
def index():
    return render_template('index.html')

# API routes for JavaScript to fetch HTML snippets
@app.route('/api/content/home')
def get_home():
    return render_template('home_content.html')

@app.route('/api/content/about')
def get_about():
    return render_template('about_content.html')

@app.route('/api/content/contact')
def get_contact():
    return render_template('contact_content.html')

@app.route('/api/content/user')
def get_login():
    return render_template('user_content.html')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)