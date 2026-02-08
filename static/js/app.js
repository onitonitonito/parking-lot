/**
 * 스마트 주차장 차량 카운팅 앱 - Compact Dashboard Logic (v3.0)
 * 고밀도 대시보드 UI 제어 및 상태 관리
 */

// ===== DOM 요소 참조 =====
// ===== DOM 요소 참조 =====
const elements = {
    // 패널 (화면 전환용)
    uploadSection: document.getElementById('uploadSection'),
    loadingSection: document.getElementById('loadingSection'),
    resultSection: document.getElementById('resultSection'),

    // 업로드 관련
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    uploadContent: document.querySelector('.upload-content'),
    uploadPreview: document.getElementById('previewImage'), // ID 수정 주의 (HTML id="previewImage")
    uploadWrapper: document.getElementById('uploadPreview'), // 래퍼
    removePreview: document.getElementById('removePreview'),
    analyzeBtn: document.getElementById('analyzeBtn'),

    // 결과/슬라이더 관련
    compareContainer: document.getElementById('compareContainer'),
    originalImage: document.getElementById('originalImage'),
    resultImage: document.getElementById('resultImage'),
    imgOverlay: document.getElementById('imgOverlay'),
    compareHandle: document.getElementById('compareHandle'),

    // 통계 및 기능
    carCount: document.getElementById('carCount'),
    fileName: document.getElementById('fileName'),
    analysisTime: document.getElementById('analysisTime'),
    newAnalysisBtn: document.getElementById('newAnalysisBtn'),
    breakdownBar: document.getElementById('breakdownBar'),
    btnHeatmap: document.getElementById('btnHeatmap'),

    // 히스토리
    historyList: document.getElementById('historyList'),
    historyEmpty: document.getElementById('historyEmpty'),
    refreshHistoryBtn: document.getElementById('refreshHistoryBtn'),

    // 언어 설정
    langToggle: document.getElementById('langToggle'),
    langText: document.getElementById('langText')
};

// ===== 상태 관리 =====
const state = {
    selectedFile: null,
    currentDetection: null,
    isAnalyzing: false,
    isDragging: false,
    heatmapActive: false,
    originalResultUrl: null, // 히트맵 토글 시 복원용
    lang: 'KO' // 기본 언어: 한국어
};

// ===== i18n (다국어 설정) =====
const i18n = {
    KO: {
        'logoTitle': 'AI 드론 비전',
        'logoSub': '스마트 주차장 모니터링',
        'status': '시스템 작동 중',
        'uploadTitle': '드론 이미지 업로드',
        'uploadDesc': '이미지를 여기 놓거나 클릭하여 스캔',
        'btnScan': '스캔 시작',
        'btnCancel': '취소',
        'loadingTitle': '객체 분석 중...',
        'loadingDesc': 'RT-DETR 트랜스포머 프로세싱',
        'resultTitle': '분석 보고서',
        'statDetected': '감지된 차량',
        'statFile': '파일명',
        'historyTitle': '📋 스캔 로그',
        'historyEmpty': '로그 없음',
        'footerStatus': '상태: 활성',
        // 분류 라벨
        'car': '승용차',
        'bus': '버스',
        'truck': '트럭',
        'motorcycle': '이륜차',
        'person': '보행자',
        'other': '기타'
    },
    EN: {
        'logoTitle': 'AI DRONE VISION',
        'logoSub': 'SMART PARKING MONITOR',
        'status': 'SYSTEM ONLINE',
        'uploadTitle': 'DRONE IMAGERY UPLOAD',
        'uploadDesc': 'Drop image or Click to scan',
        'btnScan': 'SCAN START',
        'btnCancel': 'CANCEL',
        'loadingTitle': 'ANALYZING OBJECTS...',
        'loadingDesc': 'RT-DETR Transformer Processing',
        'resultTitle': 'ANALYSIS REPORT',
        'statDetected': 'DETECTED VEHICLES',
        'statFile': 'FILE NAME',
        'historyTitle': '📋 SCAN LOGS',
        'historyEmpty': 'No Logs',
        'footerStatus': 'STATUS: ACTIVE',
        // Breakdown labels
        'car': 'CAR',
        'bus': 'BUS',
        'truck': 'TRUCK',
        'motorcycle': 'BIKE',
        'person': 'PERSON',
        'other': 'OTHER'
    }
};

// ===== API 함수 =====
const api = {
    async uploadAndAnalyze(file) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error((await res.json()).error || 'Upload Failed');
        return await res.json();
    },
    async getHistory() {
        const res = await fetch('/api/history');
        if (!res.ok) throw new Error('Load Failed');
        return (await res.json()).detections;
    },
    async deleteDetection(id) {
        const res = await fetch(`/api/detection/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete Failed');
        return await res.json();
    }
};

// ===== UI 로직 =====
const ui = {
    showPanel(panelName) {
        elements.uploadSection.style.display = 'none';
        elements.loadingSection.style.display = 'none';
        elements.resultSection.style.display = 'none';

        if (panelName === 'upload') elements.uploadSection.style.display = 'flex';
        else if (panelName === 'loading') elements.loadingSection.style.display = 'flex';
        else if (panelName === 'result') {
            elements.resultSection.style.display = 'flex';
            setTimeout(ui.initSlider, 100);
        }
    },

    showPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.uploadPreview.src = e.target.result;
            elements.uploadContent.style.display = 'none';
            elements.uploadWrapper.style.display = 'flex';
            elements.analyzeBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    },

    resetPreview() {
        state.selectedFile = null;
        elements.fileInput.value = '';
        elements.uploadPreview.src = '';
        elements.uploadContent.style.display = 'block';
        elements.uploadWrapper.style.display = 'none';
        elements.analyzeBtn.disabled = true;
    },

    showResult(detection, details = null) {
        // detection 객체에 details가 없으면 전달받은 details로 채워줌 (heatmap 작동 보장)
        if (details && !detection.details) {
            detection.details = details;
        }

        state.currentDetection = detection;
        // 히트맵 상태 초기화
        state.heatmapActive = false;
        elements.btnHeatmap.classList.remove('active');
        state.originalResultUrl = detection.result_path;

        // 데이터 바인딩
        ui.animateCount(elements.carCount, detection.car_count);
        elements.fileName.textContent = detection.original_filename;
        elements.fileName.title = detection.original_filename;

        const d = new Date(detection.detected_at);
        elements.analysisTime.textContent = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

        // 이미지
        elements.originalImage.src = detection.upload_path;
        elements.resultImage.src = detection.result_path;

        // 상세 분석 (Details) 처리
        // 1. API 응답(details) 우선 2. DB 저장된 details 확인
        const finalDetails = details || detection.details;
        ui.renderBreakdown(finalDetails);

        ui.showPanel('result');
    },

    renderBreakdown(details) {
        const bar = elements.breakdownBar;
        bar.innerHTML = ''; // 초기화

        if (!details || !details.breakdown) {
            bar.style.display = 'none';
            return;
        }

        bar.style.display = 'flex';

        // 순서: car -> bus -> truck -> motorcycle -> person
        const order = ['car', 'bus', 'truck', 'motorcycle', 'person'];
        const dict = i18n[state.lang];

        // 아이템 생성 헬퍼
        const createItem = (key, val) => {
            if (!val || val === 0) return;
            const div = document.createElement('div');
            div.className = 'breakdown-item';
            div.innerHTML = `
                <span class="breakdown-dot"></span>
                <span class="breakdown-label">${dict[key] || key.toUpperCase()}</span>
                <span class="breakdown-value">${val}</span>
            `;
            bar.appendChild(div);
        };

        order.forEach(key => createItem(key, details.breakdown[key]));

        // 기타 항목
        if (details.breakdown.other > 0) createItem('other', details.breakdown.other);
    },

    // 캔버스에 히트맵 그리기
    async toggleHeatmap() {
        if (!state.currentDetection || !state.currentDetection.details || !state.currentDetection.details.objects) {
            console.error('Heatmap data missing:', state.currentDetection);
            alert('히트맵을 생성할 상세 데이터가 없습니다.');
            return;
        }

        state.heatmapActive = !state.heatmapActive;
        const btn = elements.btnHeatmap;

        if (state.heatmapActive) {
            btn.classList.add('active');
            // 히트맵 생성 및 적용
            const heatUrl = await ui.generateHeatmapUrl();
            elements.resultImage.src = heatUrl;
        } else {
            btn.classList.remove('active');
            // 원래 이미지 복원
            elements.resultImage.src = state.originalResultUrl;
        }
    },

    generateHeatmapUrl() {
        return new Promise((resolve) => {
            // 원본 이미지 로드하여 사이즈 확인
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = state.currentDetection.upload_path; // 히트맵용 원본 이미지 사용

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');

                // 1. 배경: 원본(파운딩박스 포함된 결과) 이미지 그리기 (반투명?)
                // 히트맵만 보고 싶으면 원본 위에 그려야 함.
                // 여기서는 'Result Image' 자체를 대체하므로, 원본 결과 위에 히트맵을 덧칠함.
                ctx.drawImage(img, 0, 0);

                // 2. 히트맵 그리기
                const objects = state.currentDetection.details.objects;

                // 블렌딩 모드 설정 (빛나는 효과)
                ctx.globalCompositeOperation = 'screen';

                objects.forEach(obj => {
                    // 차량만? 아니면 사람도? -> 차량 중심 (car, bus, truck)
                    if (['car', 'bus', 'truck'].includes(obj.class)) {
                        const x = obj.x;
                        const y = obj.y;
                        const radius = Math.max(obj.w, obj.h) * 1.5; // 객체 크기 비례

                        // 그라데이션 (중심 Red -> 투명)
                        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
                        grad.addColorStop(0, 'rgba(255, 0, 0, 0.6)');
                        grad.addColorStop(0.5, 'rgba(255, 50, 0, 0.3)');
                        grad.addColorStop(1, 'rgba(255, 0, 0, 0)');

                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });

                resolve(canvas.toDataURL());
            };
        });
    },

    initSlider() {
        // v3.0: clip-path 사용
        const initialPercent = 50;
        elements.imgOverlay.style.clipPath = `inset(0 ${100 - initialPercent}% 0 0)`;
        elements.compareHandle.style.left = `${initialPercent}%`;
    },

    updateSlider(clientX) {
        if (!elements.compareContainer) return;
        const rect = elements.compareContainer.getBoundingClientRect();
        let x = clientX - rect.left;
        if (x < 0) x = 0; if (x > rect.width) x = rect.width;

        const percent = (x / rect.width) * 100;

        // clip-path 업데이트: 오른쪽을 잘라내어 왼쪽을 보여줌
        // inset(top right bottom left) -> inset(0, 100-percent%, 0, 0)
        elements.imgOverlay.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
        elements.compareHandle.style.left = `${percent}%`;
    },

    animateCount(el, target) {
        let start = 0;
        const duration = 1000;
        const startTime = performance.now();
        function update(time) {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const val = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            el.textContent = Math.round(start + (target - start) * val);
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    },

    renderHistory(list) {
        elements.historyList.innerHTML = '';
        if (!list || list.length === 0) {
            elements.historyEmpty.style.display = 'flex';
            ui.applyLanguage(); // "로그 없음" 등 텍스트 적용 확인
            return;
        }
        elements.historyEmpty.style.display = 'none';

        list.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-thumb"><img src="${item.result_path}"></div>
                <div class="history-info">
                    <h4>${item.original_filename}</h4>
                    <span>${new Date(item.detected_at).toLocaleDateString()}</span>
                </div>
                <div class="history-count">${item.car_count}</div>
            `;
            // 클릭 이벤트: details가 이미 포함되어 있음 (getHistory API가 반환함)
            div.addEventListener('click', () => ui.showResult(item));
            elements.historyList.appendChild(div);
        });
    },

    // 언어 적용 기능
    applyLanguage() {
        const dict = i18n[state.lang];
        const langCode = state.lang === 'KO' ? 'EN' : 'KO';
        elements.langText.textContent = langCode;

        // ID가 t-로 시작하는 요소 자동 번역
        document.querySelectorAll('[id^="t-"]').forEach(el => {
            const key = el.id.replace('t-', '');
            if (dict[key]) {
                el.textContent = dict[key];
            }
        });

        // 현재 결과 화면인 경우 통계 그래프 다시 그리기
        if (state.currentDetection) {
            ui.renderBreakdown(state.currentDetection.details);
        }
    }
};

// ===== 이벤트 핸들러 =====
const handlers = {
    handleFile(file) {
        if (file && file.type.startsWith('image/')) {
            state.selectedFile = file;
            ui.showPreview(file);
        }
    },
    async analyze() {
        if (!state.selectedFile || state.isAnalyzing) return;
        state.isAnalyzing = true;
        ui.showPanel('loading');

        try {
            // 분석 요청: res에 { detection: ..., details: ... } 포함
            const res = await api.uploadAndAnalyze(state.selectedFile);

            // showResult 호출 시 details 전달 (DB에서 조회된 detection 객체에 병합하거나 별도로 넘김)
            // res.detection에는 아직 details가 없을 수도 있음 (DB select 시점에 따라)
            // 하지만 api.uploadAndAnalyze 반환값에 details를 명시적으로 포함시켰으므로 그것을 사용.
            ui.showResult(res.detection, res.details);

            await handlers.refreshHistory();
        } catch (e) {
            alert('Error: ' + e.message);
            ui.showPanel('upload');
        } finally {
            state.isAnalyzing = false;
        }
    },
    async refreshHistory() {
        try {
            const list = await api.getHistory();
            ui.renderHistory(list);
        } catch (e) { console.error(e); }
    }
};

// ===== 초기화 =====
function initEvents() {
    // 업로드
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', (e) => handlers.handleFile(e.target.files[0]));

    // 드래그앤드롭
    elements.uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); elements.uploadArea.style.borderColor = '#00f0ff'; });
    elements.uploadArea.addEventListener('dragleave', (e) => { e.preventDefault(); elements.uploadArea.style.borderColor = ''; });
    elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea.style.borderColor = '';
        handlers.handleFile(e.dataTransfer.files[0]);
    });

    // 버튼
    elements.removePreview.addEventListener('click', (e) => { e.stopPropagation(); ui.resetPreview(); });
    elements.analyzeBtn.addEventListener('click', (e) => { e.stopPropagation(); handlers.analyze(); });
    elements.newAnalysisBtn.addEventListener('click', () => { ui.resetPreview(); ui.showPanel('upload'); });
    elements.refreshHistoryBtn.addEventListener('click', handlers.refreshHistory);

    // 히트맵 버튼
    elements.btnHeatmap.addEventListener('click', ui.toggleHeatmap);

    // 언어 전환
    elements.langToggle.addEventListener('click', () => {
        state.lang = state.lang === 'KO' ? 'EN' : 'KO';
        ui.applyLanguage();
    });

    // 슬라이더 드래그
    if (elements.compareContainer) {
        const start = (e) => {
            state.isDragging = true;
            // 터치/마우스 시작 시에도 위치 업데이트 (UX 향상)
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            // ui.updateSlider(clientX); // 드래그 시작 시 점프 방지를 위해 일단 주석
        };
        const end = () => { state.isDragging = false; };
        const move = (e) => {
            if (!state.isDragging) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            ui.updateSlider(clientX);
        };

        elements.compareContainer.addEventListener('mousedown', start);
        elements.compareContainer.addEventListener('touchstart', start);
        window.addEventListener('mouseup', end);
        window.addEventListener('touchend', end);
        window.addEventListener('mousemove', move);
        window.addEventListener('touchmove', move);
    }
}

// 실행
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Compact Dashboard v3.0 Init');

    // PWA Service Worker (배포 모드)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW Registered:', reg.scope))
            .catch(err => console.log('SW Fail:', err));
    }

    // 창 크기 조절 요청 (1286x791)
    // 브라우저 정책에 따라 무시될 수 있음 (특히 탭 모드에서)
    try {
        if (window.outerWidth !== 1286 || window.outerHeight !== 791) {
            window.resizeTo(2062, 991);
        }
    } catch (e) { console.warn('Window Resize Blocked'); }

    initEvents();
    ui.applyLanguage(); // 초기 언어 적용 (기본 KO)
    handlers.refreshHistory();
    ui.showPanel('upload');
});
