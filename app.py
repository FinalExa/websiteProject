import os
import re
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify, url_for  # Added url_for
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
from flask import session

load_dotenv() 

app = Flask(__name__)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'project.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key-if-missing')
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False

db = SQLAlchemy(app)
mail = Mail(app)
serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])

class UserData(db.Model):
    username = db.Column(db.String(100), primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    password = db.Column(db.Text, nullable=False)
    is_verified = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f'<Message from {self.name}>'

@app.route('/')
@app.route('/home')
@app.route('/about')
@app.route('/contact')
@app.route('/user')
def index():
    return render_template('index.html')

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

    if UserData.query.filter_by(username=username).first():
        return jsonify({"status": "error", "message": "Username already taken"}), 400
    
    new_user = UserData(
        username=username,
        email=email,
        password=data.get('password'),
        is_verified=False
    )
    db.session.add(new_user)
    db.session.commit()

    token = serializer.dumps(username, salt='email-confirm')
    verify_url = url_for('confirm_email', token=token, _external=True)
    
    msg = Message('Confirm Your Account', 
                  sender=app.config['MAIL_USERNAME'], 
                  recipients=[email])
    msg.body = f'Welcome {username}! Click here to verify your account: {verify_url}'
    
    try:
        mail.send(msg)
        return jsonify({"status": "success", "message": "Check your email to verify!"})
    except Exception as e:
        print(f"MAIL ERROR: {e}")
        return jsonify({"status": "error", "message": f"Mail Error: {str(e)}"}), 500

@app.route('/verify/<token>')
def confirm_email(token):
    try:
        username = serializer.loads(token, salt='email-confirm', max_age=1800)
    except:
        return "<h1>The confirmation link is invalid or has expired.</h1>"

    user = UserData.query.filter_by(username=username).first()
    if user:
        if user.is_verified:
            return "<h1>Account already verified. Please log in.</h1>"
        else:
            user.is_verified = True
            db.session.commit()
            return "<h1>Account verified successfully! You can now close this window.</h1>"
    
    return "<h1>User not found.</h1>"

@app.route('/api/content/login-view')
def get_login_view():
    return render_template('login_content.html')

@app.route('/api/content/register-view')
def get_register_view():
    return render_template('register_content.html')

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = UserData.query.filter_by(username=username).first()

    if not user:
        return jsonify({"status": "error", "message": "Username not found"}), 404
    
    if user.password != password:
        return jsonify({"status": "error", "message": "Incorrect password"}), 401
    
    if not user.is_verified:
        return jsonify({"status": "error", "message": "Please verify your email first."}), 403

    # --- NEW SESSION LOGIC ---
    session['user'] = user.username
    return jsonify({"status": "success", "message": "Logged in successfully!"})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({"status": "success", "message": "Logged out"})

@app.route('/api/check-auth')
def check_auth():
    if 'user' in session:
        return jsonify({"is_logged_in": True, "user": session['user']})
    return jsonify({"is_logged_in": False})

@app.route('/api/content/personal-area')
def get_personal_area():
    if 'user' in session:
        return render_template('personal_area_content.html')
    return "Unauthorized", 401

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)