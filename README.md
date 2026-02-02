1. # 🚁 드론 사진 차량 카운팅 앱

   야외 주차장의 드론 항공사진을 업로드하면 **YOLOv8 AI**가 자동으로 차량을 감지하고 카운팅하는 웹 애플리케이션입니다.

   ------

   

   ## 🛠 기술 스택

   - 🔹 **백엔드**: Python, Flask
   - 🤖 **AI 모델**: YOLOv8 (ultralytics)
   - 🗄 **데이터베이스**: SQLite3
   - 🎨 **프론트엔드**: HTML, JavaScript, Vanilla CSS (SPA)

   ------



### [AI 드론관리 주차장]

<img width="550"
   alt="home_top"
   src="static\images\home_01_top.png"/>

<img width="550"
   alt="home_bottom"
   src="static\images\home_02_bottom.png"/>



   ## ⚙ 설치 방법

```Shell
   \# 1️⃣ 가상 환경 생성 및 활성화
   python -m venv venv
   source venv/Scripts/activate  # Windows

   \# 2️⃣ 의존성 설치
   pip install -r requirements.txt

   \# 3️⃣ 서버 실행
   python app.py
```
------



   ## 🚀 사용 방법

   1️⃣ 브라우저에서 `http://localhost:5000` 접속
   2️⃣ 드론으로 촬영한 주차장 사진 업로드
   3️⃣ AI가 자동으로 차량을 감지하고 결과 표시
   4️⃣ 히스토리에서 이전 분석 결과 확인 가능

------



   ## 📁 프로젝트 구조

   ```
   parking-lot/
   ├── app.py              # Flask 메인 앱
   ├── database.py         # SQLite3 DB 관리
   ├── detector.py         # YOLOv8 차량 탐지
   ├── requirements.txt    # Python 의존성
   ├── templates/
   │   └── index.html      # SPA 메인 페이지
   ├── static/
   │   ├── css/
   │   │   └── style.css   # 스타일시트
   │   ├── js/
   │   │   └── app.js      # 프론트엔드 로직
   │   ├── imagess/        # 앱 사용 이미지
   │   ├── uploads/        # 업로드된 드론 이미지
   │   └── results/        # 탐지 결과 이미지
   └── instance/
       └── parking.db      # SQLite 데이터베이스
   ```

------



   # ✅ [Task] 드론 사진 차량 카운팅 앱

   ### 📌 1️⃣ 프로젝트 초기화 [/]

   - 디렉토리 구조 생성
   - 가상 환경 및 의존성 설치

   ### 📌 2️⃣ 백엔드 구현 [ ]

   - Flask 앱 초기화
   - SQLite 데이터베이스 설정
   - YOLOv8을 이용한 차량 카운팅 로직 구현
   - API 엔드포인트 생성 (업로드, 히스토리)

   ### 📌 3️⃣ 프론트엔드 구현 [ ]

   - Vanilla CSS로 UI 디자인 (모던 & 프리미엄)
   - Single Page App 구조 생성
   - 이미지 업로드 및 결과 표시 기능 구현
   - 히스토리 표시 기능 구현

   ### 📌 4️⃣ 검증 및 폴리싱 [ ]

   - 차량 탐지 정확도 테스트
   - 데이터베이스 저장 확인
   - 시각적 디테일 및 애니메이션 보정

------



   # 🧩 [Build] 차량 카운팅 앱 구현 계획

   드론으로 촬영한 야외 주차장 사진에서 **YOLOv8**을 사용하여 차량을 자동으로 카운팅하고,
    모던한 **SPA 인터페이스**와 **SQLite3 히스토리 관리 기능**을 제공하는 앱입니다.

------



   ## ⚠ 사용자 검토 필요 또는 확인 사항



>### 🔴 IMPORTANT
>
>Node.JS 사용이 제한됨에 따라, 백엔드는 **Python Flask**를 사용합니다.
>이는 YOLOv8과의 원활한 통합 및 정확한 차량 탐지, 그리고 SQLite3 관리를 위해 가장 최적화된 선택입니다.

>### 🟡 NOTE
>
>차량 탐지에는 `ultralytics`의 **YOLOv8n 모델**을 사용합니다.
>이 모델은 항공 사진에서의 차량 탐지에 효율적이고 정확합니다.

------



   ## 🔄 제안 된 변경 사항

   ### 🔧 백엔드 (Python / Flask)

   - 🆕 `app.py`: 라우팅 및 YOLO 로직을 처리하는 메인 Flask 애플리케이션
   - 🆕 `database.py`: SQLite3 데이터베이스 스키마 및 헬퍼 함수
   - 🆕 `detector.py`: YOLOv8 차량 탐지 로직 래퍼

   ### 🎨 프론트엔드 (SPA - HTML / JS / CSS)

   - 🆕 `templates/index.html`: 모던하고 미려한 디자인의 SPA 레이아웃
   - 🆕 `static/css/style.css`: 애니메이션과 반응형 레이아웃이 적용된 프리미엄 스타일링
   - 🆕 `static/js/app.js`: 파일 업로드, 진행 상태 추적, 히스토리 관리를 위한 프론트엔드 로직



   ### 💾 데이터 저장

   - 🆕 `instance/parking.db`: 탐지 결과 및 이미지 정보를 저장하는 SQLite 데이터베이스

------



   ## 🧪 검증 계획

   ### ✅ 자동 테스트

   - 🔍 탐지 테스트: 샘플 드론 이미지를 활용하여 차량 탐지 정확도 확인
   - 🔗 API 테스트: `curl` 등을 사용하여 업로드 및 히스토리 엔드포인트 동작 확인

   ### ✅ 수동 검증

   1️⃣ 주차장 항공 사진 업로드
   2️⃣ 탐지된 차량에 표시된 바운딩 박스 확인
   3️⃣ 카운팅 결과가 실제와 일치하는지 확인
   4️⃣ 페이지 새로고침 후 히스토리 기록 유지 여부 확인





   ## 🧪 릴리즈 노트

 1. **v1.0-Release.a1-1** - 2026-02-02

 2. 

    
