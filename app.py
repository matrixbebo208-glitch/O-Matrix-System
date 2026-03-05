import os
import sqlite3
import re
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, session, redirect, url_for

app = Flask(__name__)
app.secret_key = "osystem_secure_vault_99" # مفتاح لتأمين الجلسات الداخلية

# --- الإعدادات الثابتة ---
ADMIN_PASSWORD = "01224815487"
VERSION = "Version 1.0.0"
DATABASE = 'system.db'

# --- إدارة قاعدة البيانات ---
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        # جدول تتبع الـ IP للمحاولات المجانية (5 محاولات)
        conn.execute('''CREATE TABLE IF NOT EXISTS trial_users 
                        (ip TEXT PRIMARY KEY, attempts_left INTEGER DEFAULT 5)''')
        # جدول المشتركين (تفعيل عن طريق ID)
        conn.execute('''CREATE TABLE IF NOT EXISTS subscribers 
                        (user_id TEXT PRIMARY KEY, plan_type TEXT, expiry_date TIMESTAMP)''')
        conn.commit()

init_db()

# --- وظائف المساعدة ---
def get_client_ip():
    # الحصول على IP المستخدم الحقيقي حتى لو خلف Proxy
    return request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)

# --- المسارات (Routes) ---

@app.route('/')
def index():
    user_ip = get_client_ip()
    db = get_db()
    
    # التأكد من وجود الـ IP في قاعدة البيانات أو إنشاء سجل جديد
    user = db.execute('SELECT * FROM trial_users WHERE ip = ?', (user_ip,)).fetchone()
    if not user:
        db.execute('INSERT INTO trial_users (ip) VALUES (?)', (user_ip,))
        db.commit()
        attempts = 5
    else:
        attempts = user['attempts_left']
        
    return render_template('index.html', version=VERSION, attempts=attempts)

@app.route('/process', methods=['POST'])
def process_data():
    user_ip = get_client_ip()
    user_id = request.form.get('user_id') # لو المستخدم مشترك بيدخل الـ ID بتاعه
    db = get_db()
    
    # 1. التحقق من الاشتراك المدفوع أولاً
    if user_id:
        subscriber = db.execute('SELECT * FROM subscribers WHERE user_id = ?', (user_id,)).fetchone()
        if subscriber:
            expiry = datetime.strptime(subscriber['expiry_date'], '%Y-%m-%d %H:%M:%S')
            if expiry > datetime.now():
                return jsonify({"status": "success", "msg": "اشتراك مفعل. جاري معالجة الملفات كأولوية..."})
            else:
                return jsonify({"status": "expired", "msg": "اشتراكك انتهى، يرجى التجديد."})

    # 2. التحقق من التجربة المجانية (IP)
    user = db.execute('SELECT * FROM trial_users WHERE ip = ?', (user_ip,)).fetchone()
    if user and user['attempts_left'] > 0:
        db.execute('UPDATE trial_users SET attempts_left = attempts_left - 1 WHERE ip = ?', (user_ip,))
        db.commit()
        return jsonify({"status": "trial", "remaining": user['attempts_left'] - 1})
    
    return jsonify({"status": "limit", "msg": "انتهت محاولاتك المجانية. تواصل معنا لتفعيل اشتراكك بـ 50ج فقط."})

@app.route('/admin/activate', methods=['POST'])
def activate_subscription():
    password = request.form.get('password')
    target_id = request.form.get('target_id')
    plan = request.form.get('plan') # monthly or yearly
    
    if password != ADMIN_PASSWORD:
        return jsonify({"status": "error", "msg": "كلمة سر الأدمن خاطئة!"})
    
    # حساب تاريخ الانتهاء
    days = 30 if plan == 'monthly' else 365
    expiry_date = datetime.now() + timedelta(days=days)
    
    db = get_db()
    db.execute('INSERT OR REPLACE INTO subscribers (user_id, plan_type, expiry_date) VALUES (?, ?, ?)',
               (target_id, plan, expiry_date.strftime('%Y-%m-%d %H:%M:%S')))
    db.commit()
    
    return jsonify({"status": "success", "msg": f"تم تفعيل اشتراك {plan} للـ ID: {target_id}"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
