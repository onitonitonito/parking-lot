"""
차량 탐지 모듈 (Step 2-G: RT-DETR 적용)
개선사항: YOLOv11m -> RT-DETR (Real-Time Detection Transformer) 업그레이드
- 트랜스포머 구조를 통해 차량이 밀집된 환경에서 객체 간 경계를 정교하게 구분합니다.
"""

import os
from ultralytics import RTDETR
from PIL import Image

# RT-DETR 모델 로드
model = None


def load_model():
    """RT-DETR-L 모델을 로드합니다."""
    global model
    if model is None:
        # rtdetr-l (large) 모델 사용 - 트랜스포머 기반의 최상위 정확도 모델
        # 일반 YOLO 대비 오탐(False Positive)이 적고 전역적인 특징을 잘 파악합니다.
        model = RTDETR('rtdetr-l.pt')
    return model


def detect_cars(image_path, output_path):
    """
    RT-DETR 트랜스포머 모델을 사용하여 고밀도 주차장의 차량을 정밀하게 탐지합니다.
    
    Args:
        image_path: 입력 이미지 경로
        output_path: 결과 이미지 저장 경로
        
    Returns:
        car_count: 탐지된 차량 수
    """
    model = load_model()
    
    # 차량 관련 클래스 ID (COCO 데이터셋 기준: 2=car, 5=bus, 7=truck)
    vehicle_classes = [2, 5, 7]
    
    # RT-DETR 추론 수행
    # RT-DETR은 구조적으로 작은 객체와 밀집된 객체에 강점이 있습니다.
    # imgsz=640 혹은 1024 정도로 설정하여 정확도와 속도의 균형을 맞춥니다.
    results = model(image_path, imgsz=1024, conf=0.15, verbose=False)
    
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
        
        # 결과 이미지 저장
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
        try:
            original_img = Image.open(image_path)
            original_img.save(output_path)
        except Exception as e:
            print(f"원본 이미지 백업 오류: {e}")
    
    return car_count


def get_model_info():
    """모델 정보를 반환합니다."""
    return {
        'name': 'RT-DETR (Transformer)',
        'description': 'Real-Time Detection Transformer',
        'resolution': '1024px',
        'vehicle_classes': ['car', 'bus', 'truck']
    }
