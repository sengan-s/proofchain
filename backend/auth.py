import functools
import werkzeug.security as security
from flask import session, jsonify, request
from backend.database import get_db_connection

def authenticate_user(username, password):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    conn.close()

    if user and security.check_password_hash(user['password_hash'], password):
        return {
            'id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'full_name': user['full_name'],
            'agency': user['agency']
        }
    return None

def login_required(f):
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            # Allow development convenience if authorization header is present or default session
            user_hdr = request.headers.get("X-User-Role")
            if not user_hdr:
                return jsonify({"error": "Unauthorized. Please log in."}), 401
        return f(*args, **kwargs)
    return decorated_function

def role_required(allowed_roles):
    def decorator(f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            user = session.get('user')
            role_hdr = request.headers.get("X-User-Role")
            user_role = user['role'] if user else (role_hdr if role_hdr else 'Viewer')

            if user_role not in allowed_roles and 'Admin' not in allowed_roles:
                return jsonify({"error": f"Access denied. Requires one of roles: {allowed_roles}"}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator
