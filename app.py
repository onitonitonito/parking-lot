"""
Flask 메인 애플리케이션
드론 사진 차량 카운팅 웹 서버
"""

import os
import uuid
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

from database import init_db, save_detection, get_all_detections, get_detection_by_id, delete_detection
from detector import detect_cars, get_model_info

app = Flask(__name__)

# 설정
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
RESULT_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'results')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['RESULT_FOLDER'] = RESULT_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB 최대 업로드


def allowed_file(filename):
    """허용된 파일 확장자인지 확인합니다."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def index():
    """메인 페이지를 렌더링합니다."""
    return render_template('index.html')


@app.route('/api/upload', methods=['POST'])
def upload_image():
    """이미지를 업로드하고 차량을 탐지합니다."""
    if 'image' not in request.files:
        return jsonify({'error': '이미지 파일이 필요합니다.'}), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({'error': '파일이 선택되지 않았습니다.'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': '허용되지 않는 파일 형식입니다. (PNG, JPG, JPEG, WEBP만 가능)'}), 400
    
    try:
        # 고유 파일명 생성
        original_filename = secure_filename(file.filename)
        unique_id = str(uuid.uuid4())[:8]
        ext = original_filename.rsplit('.', 1)[1].lower()
        
        upload_filename = f"{unique_id}_original.{ext}"
        result_filename = f"{unique_id}_result.{ext}"
        
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], upload_filename)
        result_path = os.path.join(app.config['RESULT_FOLDER'], result_filename)
        
        # 파일 저장
        file.save(upload_path)
        
        # 차량 탐지 수행
        car_count = detect_cars(upload_path, result_path)
        
        # 결과를 데이터베이스에 저장
        detection_id = save_detection(
            original_filename=original_filename,
            upload_path=f"/static/uploads/{upload_filename}",
            result_path=f"/static/results/{result_filename}",
            car_count=car_count
        )
        
        # 저장된 결과 조회
        detection = get_detection_by_id(detection_id)
        
        return jsonify({
            'success': True,
            'detection': detection
        })
        
    except Exception as e:
        return jsonify({'error': f'처리 중 오류가 발생했습니다: {str(e)}'}), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    """탐지 히스토리를 반환합니다."""
    detections = get_all_detections()
    return jsonify({'detections': detections})


@app.route('/api/detection/<int:detection_id>', methods=['GET'])
def get_detection(detection_id):
    """특정 탐지 결과를 반환합니다."""
    detection = get_detection_by_id(detection_id)
    
    if detection is None:
        return jsonify({'error': '탐지 결과를 찾을 수 없습니다.'}), 404
    
    return jsonify({'detection': detection})


@app.route('/api/detection/<int:detection_id>', methods=['DELETE'])
def remove_detection(detection_id):
    """특정 탐지 결과를 삭제합니다."""
    detection = get_detection_by_id(detection_id)
    
    if detection is None:
        return jsonify({'error': '탐지 결과를 찾을 수 없습니다.'}), 404
    
    # 파일 삭제
    try:
        # /static/uploads/xxx.jpg -> static/uploads/xxx.jpg
        upload_relative = detection['upload_path'].lstrip('/').replace('/', os.sep)
        result_relative = detection['result_path'].lstrip('/').replace('/', os.sep)
        
        upload_file = os.path.join(os.path.dirname(__file__), upload_relative)
        result_file = os.path.join(os.path.dirname(__file__), result_relative)
        
        print(f"삭제 시도 - 원본: {upload_file}")
        print(f"삭제 시도 - 결과: {result_file}")
        
        if os.path.exists(upload_file):
            os.remove(upload_file)
            print(f"원본 파일 삭제 완료: {upload_file}")
        else:
            print(f"원본 파일 없음: {upload_file}")
            
        if os.path.exists(result_file):
            os.remove(result_file)
            print(f"결과 파일 삭제 완료: {result_file}")
        else:
            print(f"결과 파일 없음: {result_file}")
            
    except Exception as e:
        print(f"파일 삭제 오류: {e}")
    
    delete_detection(detection_id)
    
    return jsonify({'success': True, 'message': '삭제되었습니다.'})


@app.route('/api/model-info', methods=['GET'])
def model_info():
    """모델 정보를 반환합니다."""
    info = get_model_info()
    return jsonify(info)


if __name__ == '__main__':
    # 필요한 디렉토리 생성
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(RESULT_FOLDER, exist_ok=True)
    
    # 데이터베이스 초기화
    init_db()
    
    # 개발 서버 실행
    print("🚗 드론 사진 차량 카운팅 서버 시작...")
    print("📍 http://localhost:5000 에서 접속하세요")
    app.run(debug=True, host='0.0.0.0', port=5000)
