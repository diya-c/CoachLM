from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from database import db
from config import Config


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    CORS(app)

    @app.before_request
    def handle_options():
        if request.method == 'OPTIONS':
            res = Response()
            res.headers['Access-Control-Allow-Origin'] = '*'
            res.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            res.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            return res, 200

    from auth_routes import auth_bp
    from interview_routes import interview_bp
    app.register_blueprint(auth_bp, url_prefix='/')
    app.register_blueprint(interview_bp, url_prefix='/')

    with app.app_context():
        db.create_all()
        print("[CoachLM] Database tables created/verified.")

    @app.route('/health', methods=['GET'])
    def health():
        return jsonify({'status': 'CoachLM API is running'}), 200

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)



