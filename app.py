import os
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify, session
from itsdangerous import URLSafeTimedSerializer

from models import db, UserData
from mail_utils import mail
import auth # Import our new logic file

load_dotenv()
app = Flask(__name__)

# Configs
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'project.db')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key-if-missing')
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False

db.init_app(app)
mail.init_app(app)
serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])

# Page Routes
@app.route('/')
@app.route('/home')
@app.route('/about')
@app.route('/contact')
@app.route('/user')
def index():
    return render_template('index.html')

# Dynamic Content API
@app.route('/api/content/<page>')
def get_content(page):
    templates = {
        'home': 'home_content.html', 'about': 'about_content.html',
        'contact': 'contact_content.html', 'user': 'user_content.html',
        'login-view': 'login_content.html', 'register-view': 'register_content.html',
        'personal-area': 'personal_area_content.html'
    }
    if page in templates:
        return render_template(templates[page])
    return "Not Found", 404

# Auth Endpoints
@app.route('/api/register', methods=['POST'])
def register():
    return auth.handle_register(request.get_json(), serializer, app.config['MAIL_USERNAME'])

@app.route('/api/login', methods=['POST'])
def login():
    return auth.handle_login(request.get_json())

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({"status": "success", "message": "Logged out"})

@app.route('/api/check-auth')
def check_auth():
    return jsonify({"is_logged_in": 'user' in session, "user": session.get('user')})

@app.route('/verify/<token>')
def confirm_email(token):
    try:
        username = serializer.loads(token, salt='email-confirm', max_age=1800)
        user = UserData.query.filter_by(username=username).first()
        if user and not user.is_verified:
            user.is_verified = True
            db.session.commit()
            return "<h1>Verified! You can now log in.</h1>"
    except:
        pass
    return "<h1>Invalid or expired link.</h1>"

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)