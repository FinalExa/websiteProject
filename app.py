import os
import re
from dotenv import load_dotenv
from flask import Flask
from flask import Flask, render_template
from flask import request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer

app = Flask(__name__)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'project.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
# Mail settings (example for Gmail)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True

mail = Mail(app)
serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])

class UserMessage(db.Model):
    username = db.Column(db.String(100), primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    password = db.Column(db.Text, nullable=False)
    is_verified = db.Column(db.Boolean, default=False)

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

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')

    # Check if username or email already exists
    if UserMessage.query.filter_by(username=username).first():
        return jsonify({"status": "error", "message": "Username already taken"}), 400
    
    # Save user as UNVERIFIED
    new_user = UserMessage(
        username=username,
        email=email,
        password=data.get('password'),
        is_verified=False
    )
    db.session.add(new_user)
    db.session.commit()

    # Generate token and send email
    token = serializer.dumps(username, salt='email-confirm')
    verify_url = url_for('confirm_email', token=token, _external=True)
    
    msg = Message('Confirm Your Account', 
                  sender=app.config['MAIL_USERNAME'], 
                  recipients=[email])
    msg.body = f'Welcome {username}! Click here to verify your account: {verify_url}'
    
    try:
        mail.send(msg)
        return jsonify({"status": "success", "message": "Check your email to verify your account!"})
    except Exception as e:
        return jsonify({"status": "error", "message": "Failed to send email."}), 500

@app.route('/verify/<token>')
def confirm_email(token):
    try:
        # Link expires in 30 minutes (1800 seconds)
        username = serializer.loads(token, salt='email-confirm', max_age=1800)
    except:
        return "<h1>The confirmation link is invalid or has expired.</h1>"

    user = UserMessage.query.filter_by(username=username).first()
    if user:
        if user.is_verified:
            return "<h1>Account already verified. Please log in.</h1>"
        else:
            user.is_verified = True
            db.session.commit()
            return "<h1>Account verified successfully! You can now close this window.</h1>"
    
    return "<h1>User not found.</h1>"

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)