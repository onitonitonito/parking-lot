"""
차량 탐지 모듈
YOLOv8을 사용하여 드론 사진에서 차량을 탐지합니다.
"""

import os
from ultralytics import YOLO
from PIL import Image

# YOLOv8 모델 로드 (첫 실행 시 자동 다운로드)
model = None


def load_model():
    """YOLOv8 모델을 로드합니다."""
    global model
    if model is None:
        # YOLOv8n (nano) 모델 사용 - 빠른 추론 속도
        model = YOLO('yolov8n.pt')
    return model


def detect_cars(image_path, output_path):
    """
    이미지에서 차량을 탐지하고 결과를 저장합니다.
    
    Args:
        image_path: 입력 이미지 경로
        output_path: 결과 이미지 저장 경로
        
    Returns:
        car_count: 탐지된 차량 수
    """
    model = load_model()
    
    # YOLO에서 차량 관련 클래스 ID
    # COCO 데이터셋 기준: 2=car, 5=bus, 7=truck
    vehicle_classes = [2, 5, 7]
    
    # 이미지에서 객체 탐지 수행
    results = model(image_path, conf=0.25, verbose=False)
    
    car_count = 0
    result_saved = False
    
    for result in results:
        boxes = result.boxes
        
        # 탐지된 객체가 있는 경우에만 처리
        if boxes is not None and len(boxes) > 0:
            for box in boxes:
                cls_id = int(box.cls[0])
                
                # 차량 클래스인 경우만 카운트
                if cls_id in vehicle_classes:
                    car_count += 1
        
        # 결과 이미지 저장 (탐지 여부와 관계없이)
        try:
            plotted = result.plot(
                labels=True,
                conf=True,
                line_width=2
            )
            
            # PIL 이미지로 변환하여 저장
            img = Image.fromarray(plotted)
            img.save(output_path)
            result_saved = True
        except Exception as e:
            print(f"결과 이미지 생성 오류: {e}")
    
    # 결과 이미지가 저장되지 않았다면 원본 이미지 복사
    if not result_saved:
        original_img = Image.open(image_path)
        original_img.save(output_path)
    
    return car_count


def get_model_info():
    """모델 정보를 반환합니다."""
    model = load_model()
    return {
        'name': 'YOLOv8n',
        'task': 'object detection',
        'vehicle_classes': ['car', 'bus', 'truck']
    }
