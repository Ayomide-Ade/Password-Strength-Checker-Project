from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import json

# Make sure Flask can find templates and static files
app = Flask(__name__, 
            template_folder='templates',
            static_folder='static')

CORS(app) # Enable CORS for all domains

COMMON_PASSWORDS = {
    '000000', '111111', '11111111', '121212', '123123', '123321', '1234', '12345',
    '123456', '123456789', '1234567890', '123321', '1234567890', '1qaz2wsx',
    '654321', '6543211', '696969', 'aa123456', 'aaaaaa', 'abc123', 'abc123456',
    'abcd1234', 'access', 'admin', 'admin1', 'admin123', 'amanda', 'andrea',
    'andrew', 'angel', 'angel1', 'ashley', 'asdf1234', 'asdfgh', 'asd123',
    'azerty', 'banana', 'banana1', 'barney', 'barney1', 'baseball', 'batman',
    'batman1', 'biteme', 'blessed', 'brandon', 'buster', 'buster1', 'butter',
    'butterfly', 'charlie', 'charlie1', 'charlie123', 'chelsea', 'cheese',
    'chocolate', 'computer', 'cookie', 'dallas', 'daniel', 'diamond', 'donald',
    'donald1', 'donald123', 'dragon', 'dragon1', 'dragon123', 'flower',
    'flower1', 'football', 'football1', 'football123', 'forever', 'forever1',
    'friends', 'freedom', 'george', 'george1', 'ginger', 'ginger1', 'ginger2',
    'hannah', 'happy', 'happy1', 'harley', 'heaven', 'hello', 'hello1',
    'hello123', 'hockey', 'hottie', 'hunter', 'hunter1', 'iloveu', 'iloveu2',
    'iloveu123', 'iloveyou', 'iloveyou1', 'iloveyou2', 'iloveyou123', 'jasper',
    'jennifer', 'jennifer1', 'jennifer123', 'jesus', 'jesus1', 'jesus123',
    'john', 'jordan', 'jordan1', 'jordan123', 'jordan23', 'joshua', 'justin',
    'killer', 'killer1', 'letmein', 'letmein!', 'letmein1', 'letmein123',
    'liverpool', 'love', 'love123', 'love1234', 'love12345', 'lovely', 'loveu',
    'master', 'master1', 'master123', 'matthew', 'matthew1', 'matthew123',
    'mercedes', 'michael', 'michael1', 'michael123', 'michelle', 'mickey',
    'monkey', 'monkey1', 'mylove', 'mustang', 'ninja', 'nicole', 'orange',
    'pass', 'pass123', 'pass1234', 'pass12345', 'password', 'password1',
    'password123', 'pa55word', 'patrick', 'peanut', 'peanut1', 'pepper',
    'pepper1', 'pepper2', 'pokemon', 'princess', 'princess1', 'purple',
    'purple1', 'qazwsx', 'qwe123', 'qwert', 'qwert1', 'qwert12', 'qwert123',
    'qwerty', 'qwerty1', 'qwerty12', 'qwerty123', 'qwerty1234', 'qwerty12345',
    'qwertyu', 'qwertyuiop', 'rockyou', 'root', 'root123', 'root1234',
    'samsung', 'secret', 'shadow', 'shadow1', 'shadow123', 'silver', 'soccer',
    'spiderman', 'star', 'starwars', 'summer', 'sunshine', 'sunshine1',
    'sunshine123', 'superman', 'superman!', 'superman1', 'superman123',
    'superstar', 'taylor', 'test', 'test123', 'thomas', 'tigger', 'tigger1',
    'tigger123', 'trustme', 'trustno1', 'trustno1!', 'welcome', 'welcome1',
    'welcome123', 'whatever', 'yankes', 'zxc123', 'zxcvbnm'
}

def evaluate_password_strength(password):

    if not password:
        return {
            'strength': 'Very Weak',
            'score': 0,
            'suggestions': ['Enter a password to check its strength']
        }

    score = 0

    suggestions = []

    length = len(password)
    if length >= 12:
        score += 2
    elif length >= 8:
        score += 1
    else:
        suggestions.append('Use at least 8 characters (12+ recommended)')

    has_lowercase = bool(re.search(r'[a-z]', password))
    has_uppercase = bool(re.search(r'[A-Z]', password))
    has_digits = bool(re.search(r'[0-9]', password))
    has_special = bool(re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>/?]', password))

    if has_lowercase:
        score += 1
    else:
        suggestions.append('Include lowercase letters (a-z)')

    if has_uppercase:
        score += 1
    else:
        suggestions.append('Include uppercase letters (A-Z)')

    if has_digits:
        score += 1
    else:
        suggestions.append('Include numbers (0-9)')

    if has_special:
        score += 1
    else:
        suggestions.append('Include special characters (!@#$%^&*)')

    lower_password = password.lower()

    if lower_password in COMMON_PASSWORDS:
        score = max(0, score - 2)
        suggestions.append('Avoid common passwords')

    if re.search(r'(012|123|234|345|456|567|678|789|890)', password) or \
       re.search(r'(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)', lower_password):
        score = max(0, score - 1)
        suggestions.append('Avoid sequential characters or numbers')

    if re.search(r'(.)\1{2,}', password):
        score = max(0, score - 1)
        suggestions.append('Avoid repeating characters')

    common_words = ['password', 'admin', 'user', 'login', 'welcome', 'hello', 'world']
    for word in common_words:
        if word in lower_password:
            score = max(0, score - 1)
            suggestions.append('Avoid dictionary words')
            break

    if score >= 6:
        strength = 'Very Strong'
    elif score >= 5:
        strength = 'Strong'
    elif score >= 3:
        strength = 'Medium'
    elif score >= 1:
        strength = 'Weak'
    else:
        strength = 'Very Weak'

    if score >= 5 and not suggestions:
        suggestions = ['Great job! Your password is strong.']
    elif score >= 3 and len(suggestions) <= 1:
        suggestions.append('Good password! Consider the suggestions above to make it even stronger.')

    return {
        'strength': strength,
        'score': score,
        'suggestions': suggestions
    }

# MAIN ROUTE - Serve the HTML page
@app.route('/')
def index():
    """Serve the main HTML page"""
    try:
        return render_template('index.html')
    except Exception as e:
        return f"Error loading template: {str(e)}"

@app.route('/check_password', methods=['POST'])
def check_password():
    """
    API endpoint to check password strength.
    Expects JSON: {"password": "example123!"}
    Returns: {"strength": "Strong", "score": 4, "suggestions": [...]}
    """
    try:
        data = request.get_json()

        if not data or 'password' not in data:
            return jsonify({
                'error': 'Password field is required'
            }), 400

        password = data['password']
        result = evaluate_password_strength(password)

        return jsonify(result)

    except Exception as e:
        return jsonify({
            'error': 'Internal server error'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

@app.route('/api', methods=['GET'])
def api_info():
    """API information endpoint"""
    return jsonify({
        'message': 'Password Strength Checker API',
        'endpoints': {
            'GET /': 'Main application page',
            'POST /check_password': 'Check password strength',
            'GET /health': 'Health check',
            'GET /api': 'API information'
        }
    })

if __name__ == '__main__':
    print("Starting Flask app...")
    print(f"Static folder: {app.static_folder}")
    app.run(debug=True, host='0.0.0.0', port=5000)
