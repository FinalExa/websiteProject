from flask_mail import Mail, Message
from flask import url_for

mail = Mail()

def send_verification_email(user_email, username, serializer, sender_email):
    token = serializer.dumps(username, salt='email-confirm')
    verify_url = url_for('confirm_email', token=token, _external=True)
    
    msg = Message('Confirm Your Account', 
                  sender=sender_email, 
                  recipients=[user_email])
    msg.body = f'Welcome {username}! Click here to verify your account: {verify_url}'
    
    mail.send(msg)