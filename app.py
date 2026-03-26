import os
import shutil
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify, session, url_for
from itsdangerous import URLSafeTimedSerializer

from models import db, UserData, UserPost
from mail_utils import mail
import auth

load_dotenv()
app = Flask(__name__)

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

@app.route('/')
@app.route('/home')
@app.route('/user')
def index():
    return render_template('index.html')

@app.route('/api/content/home')
def get_home_content():
    if 'user' not in session:
        return "Unauthorized", 401 
    return render_template('home_content.html')

@app.route('/api/content/<page>')
def get_content(page):
    public_pages = ['login-view', 'register-view', 'user']
    
    if 'user' not in session and page not in public_pages:
        return "Unauthorized", 401
        
    templates = {
        'home': 'home_content.html',
        'user': 'user_content.html',
        'login-view': 'login_content.html', 
        'register-view': 'register_content.html',
        'personal-area': 'personal_area_content.html'
    }
    
    if page in templates:
        return render_template(templates[page])
    return "Not Found", 404

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

@app.route('/api/posts', methods=['GET'])
def get_posts():
    if 'user' not in session:
        return jsonify({"status": "error", "message": "Login required"}), 401
    
    results = db.session.query(UserPost, UserData).join(
        UserData, UserPost.user_username == UserData.username
    ).order_by(UserPost.date_posted.desc()).all()
    
    output = []
    for post, user in results:
        # Use the stored path or a default if none exists
        pic_url = user.profile_pic_path if user.profile_pic_path else 'img/default-avatar.png'
        
        output.append({
            "id": post.id,
            "username": post.user_username,
            "content": post.content,
            "date": post.date_posted.strftime("%Y-%m-%d %H:%M"),
            "profile_pic": url_for('static', filename=pic_url)
        })
    return jsonify(output)

@app.route('/api/post', methods=['POST'])
def create_post():
    if 'user' not in session:
        return jsonify({"status": "error", "message": "Login required"}), 401

    user = UserData.query.filter_by(username=session['user']).first()
    
    if not user or not user.is_verified:
        return jsonify({"status": "error", "message": "Verify your email to post."}), 403

    data = request.get_json()
    content = data.get('content')

    if not content or len(content.strip()) == 0:
        return jsonify({"status": "error", "message": "Post cannot be empty"}), 400

    new_post = UserPost(content=content, user_username=user.username)
    db.session.add(new_post)
    db.session.commit()

    return jsonify({"status": "success", "message": "Post created!"})

@app.route('/api/delete-post/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    if 'user' not in session:
        return jsonify({"status": "error", "message": "Login required"}), 401
    
    post = UserPost.query.get_or_404(post_id)
    
    if post.user_username != session['user']:
        return jsonify({"status": "error", "message": "You can only delete your own posts."}), 403
    
    db.session.delete(post)
    db.session.commit()
    return jsonify({"status": "success", "message": "Post deleted successfully!"})

@app.route('/api/upload-profile-pic', methods=['POST'])
def upload_profile_pic():
    if 'user' not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file part"}), 400

    file = request.files['file']
    username = session['user']
    
    # Path: static/img/profile_pictures/username
    user_folder = os.path.join('static', 'img', 'profile_pictures', username)
    
    # exist_ok=True is safer for Windows permissions
    os.makedirs(user_folder, exist_ok=True) 

    try:
        for i in range(0, 5): 
            old_file = os.path.join(user_folder, f"{i+1}.png")
            new_file = os.path.join(user_folder, f"{i}.png")
            
            if i == 0 and os.path.exists(new_file):
                os.remove(new_file)
            
            if os.path.exists(old_file):
                os.rename(old_file, new_file)
                
        new_path = os.path.join(user_folder, "5.png")
        file.save(new_path)
        
        user = UserData.query.get(username)
        user.profile_pic_path = f"img/profile_pictures/{username}/5.png"
        db.session.commit()
        
        return jsonify({"status": "success", "message": "Profile picture updated!"})
        
    except PermissionError:
        return jsonify({"status": "error", "message": "Server file lock. Close any open images and try again."}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
