import re
from flask import jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, UserData
from mail_utils import send_verification_email

def handle_register(data, serializer, sender_email):
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # Password Strength Check
    password_regex = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
    if not re.match(password_regex, password):
        return jsonify({"status": "error", "message": "Password too weak."}), 400

    if UserData.query.filter_by(username=username).first():
        return jsonify({"status": "error", "message": "Username taken"}), 400
    
    # Hash and Save
    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
    new_user = UserData(username=username, email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    try:
        send_verification_email(email, username, serializer, sender_email)
        return jsonify({"status": "success", "message": "Check your email to verify!"})
    except Exception as e:
        return jsonify({"status": "error", "message": f"Mail Error: {str(e)}"}), 500

def handle_login(data):
    username = data.get('username')
    password = data.get('password')

    user = UserData.query.filter_by(username=username).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({"status": "error", "message": "Invalid credentials"}), 401
    
    if not user.is_verified:
        return jsonify({"status": "error", "message": "Verify your email first."}), 403

    session['user'] = user.username
    return jsonify({"status": "success", "message": "Logged in successfully!"})