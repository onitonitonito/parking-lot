/**
 * 스마트 주차장 차량 카운팅 앱 - 프론트엔드 로직
 * SPA 구조로 이미지 업로드, 분석, 히스토리 관리를 처리합니다.
 */

// ===== DOM 요소 참조 =====
const elements = {
    // 업로드 관련
    uploadSection: document.getElementById('uploadSection'),
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    uploadContent: document.querySelector('.upload-content'),
    uploadPreview: document.getElementById('uploadPreview'),
    previewImage: document.getElementById('previewImage'),
    removePreview: document.getElementById('removePreview'),
    analyzeBtn: document.getElementById('analyzeBtn'),

    // 로딩 관련
    loadingSection: document.getElementById('loadingSection'),
    progressBar: document.getElementById('progressBar'),

    // 결과 관련
    resultSection: document.getElementById('resultSection'),
    carCount: document.getElementById('carCount'),
    fileName: document.getElementById('fileName'),
    analysisTime: document.getElementById('analysisTime'),
    originalImage: document.getElementById('originalImage'),
    resultImage: document.getElementById('resultImage'),
    newAnalysisBtn: document.getElementById('newAnalysisBtn'),

    // 히스토리 관련
    historySection: document.getElementById('historySection'),
    historyList: document.getElementById('historyList'),
    historyEmpty: document.getElementById('historyEmpty'),
    refreshHistoryBtn: document.getElementById('refreshHistoryBtn'),

    // 모달
    imageModal: document.getElementById('imageModal'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalImage: document.getElementById('modalImage'),
    modalClose: document.getElementById('modalClose')
};

// ===== 상태 관리 =====
const state = {
    selectedFile: null,
    currentDetection: null,
    isAnalyzing: false
};

// ===== API 함수 =====
const api = {
    /**
     * 이미지를 업로드하고 차량 탐지를 수행합니다.
     */
    async uploadAndAnalyze(file) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '업로드에 실패했습니다.');
        }

        return data;
    },

    /**
     * 탐지 히스토리를 가져옵니다.
     */
    async getHistory() {
        const response = await fetch('/api/history');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '히스토리를 불러올 수 없습니다.');
        }

        return data.detections;
    },

    /**
     * 특정 탐지 결과를 삭제합니다.
     */
    async deleteDetection(id) {
        const response = await fetch(`/api/detection/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '삭제에 실패했습니다.');
        }

        return data;
    }
};

// ===== UI 함수 =====
const ui = {
    /**
     * 섹션 표시/숨김을 전환합니다.
     */
    showSection(section) {
        elements.uploadSection.style.display = 'none';
        elements.loadingSection.style.display = 'none';
        elements.resultSection.style.display = 'none';

        if (section === 'upload') {
            elements.uploadSection.style.display = 'block';
        } else if (section === 'loading') {
            elements.loadingSection.style.display = 'block';
        } else if (section === 'result') {
            elements.resultSection.style.display = 'block';
        }
    },

    /**
     * 파일 미리보기를 표시합니다.
     */
    showPreview(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            elements.previewImage.src = e.target.result;
            elements.uploadContent.style.display = 'none';
            elements.uploadPreview.style.display = 'block';
            elements.analyzeBtn.disabled = false;
        };

        reader.readAsDataURL(file);
    },

    /**
     * 파일 미리보기를 초기화합니다.
     */
    resetPreview() {
        state.selectedFile = null;
        elements.fileInput.value = '';
        elements.previewImage.src = '';
        elements.uploadContent.style.display = 'flex';
        elements.uploadPreview.style.display = 'none';
        elements.analyzeBtn.disabled = true;
    },

    /**
     * 분석 결과를 표시합니다.
     */
    showResult(detection) {
        state.currentDetection = detection;

        // 카운트 애니메이션
        ui.animateCount(elements.carCount, detection.car_count);

        // 파일명 (길면 축약)
        const shortName = detection.original_filename.length > 20
            ? detection.original_filename.substring(0, 17) + '...'
            : detection.original_filename;
        elements.fileName.textContent = shortName;
        elements.fileName.title = detection.original_filename;

        // 분석 시간
        const dateStr = new Date(detection.detected_at).toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        elements.analysisTime.textContent = dateStr;

        // 이미지
        elements.originalImage.src = detection.upload_path;
        elements.resultImage.src = detection.result_path;

        ui.showSection('result');
    },

    /**
     * 숫자 카운트 애니메이션을 수행합니다.
     */
    animateCount(element, targetValue) {
        const duration = 1000;
        const startTime = performance.now();
        const startValue = 0;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // easeOutQuart
            const eased = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.round(startValue + (targetValue - startValue) * eased);

            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    },

    /**
     * 히스토리 목록을 렌더링합니다.
     */
    renderHistory(detections) {
        if (detections.length === 0) {
            elements.historyEmpty.style.display = 'block';
            // 기존 히스토리 아이템 제거
            const items = elements.historyList.querySelectorAll('.history-item');
            items.forEach(item => item.remove());
            return;
        }

        elements.historyEmpty.style.display = 'none';

        // 기존 히스토리 아이템 제거
        const existingItems = elements.historyList.querySelectorAll('.history-item');
        existingItems.forEach(item => item.remove());

        // 새 아이템 추가
        detections.forEach(detection => {
            const item = ui.createHistoryItem(detection);
            elements.historyList.appendChild(item);
        });
    },

    /**
     * 히스토리 아이템 요소를 생성합니다.
     */
    createHistoryItem(detection) {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.dataset.id = detection.id;

        const dateStr = new Date(detection.detected_at).toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        item.innerHTML = `
            <div class="history-thumb">
                <img src="${detection.result_path}" alt="결과 미리보기" loading="lazy">
            </div>
            <div class="history-info">
                <h4>${detection.original_filename}</h4>
                <span>${dateStr}</span>
            </div>
            <div class="history-count">
                <strong>${detection.car_count}</strong>
                <span>대</span>
            </div>
            <div class="history-actions">
                <button class="btn btn-secondary history-view" title="결과 보기">👁️</button>
                <button class="btn btn-danger history-delete" title="삭제">🗑️</button>
            </div>
        `;

        // 결과 보기 버튼
        const viewBtn = item.querySelector('.history-view');
        viewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            ui.showResult(detection);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // 삭제 버튼
        const deleteBtn = item.querySelector('.history-delete');
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('이 분석 결과를 삭제하시겠습니까?')) {
                await handlers.deleteDetection(detection.id);
            }
        });

        // 아이템 클릭 시 결과 보기
        item.addEventListener('click', () => {
            ui.showResult(detection);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        return item;
    },

    /**
     * 이미지 모달을 표시합니다.
     */
    showModal(imageSrc) {
        elements.modalImage.src = imageSrc;
        elements.imageModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    /**
     * 이미지 모달을 닫습니다.
     */
    closeModal() {
        elements.imageModal.classList.remove('active');
        document.body.style.overflow = '';
    },

    /**
     * 토스트 알림을 표시합니다.
     */
    showToast(message, type = 'info') {
        // 간단한 alert 대체 (추후 커스텀 토스트로 변경 가능)
        if (type === 'error') {
            alert('❌ ' + message);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
};

// ===== 이벤트 핸들러 =====
const handlers = {
    /**
     * 파일 선택 처리
     */
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            state.selectedFile = file;
            ui.showPreview(file);
        }
    },

    /**
     * 드래그 앤 드롭 처리
     */
    handleDragOver(e) {
        e.preventDefault();
        elements.uploadArea.classList.add('drag-over');
    },

    handleDragLeave(e) {
        e.preventDefault();
        elements.uploadArea.classList.remove('drag-over');
    },

    handleDrop(e) {
        e.preventDefault();
        elements.uploadArea.classList.remove('drag-over');

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            state.selectedFile = file;
            ui.showPreview(file);
        }
    },

    /**
     * 분석 시작 처리
     */
    async handleAnalyze() {
        if (!state.selectedFile || state.isAnalyzing) return;

        state.isAnalyzing = true;
        ui.showSection('loading');

        try {
            const result = await api.uploadAndAnalyze(state.selectedFile);
            ui.showResult(result.detection);

            // 히스토리 새로고침
            await handlers.refreshHistory();

            // 업로드 영역 초기화
            ui.resetPreview();

        } catch (error) {
            console.error('분석 오류:', error);
            ui.showToast(error.message, 'error');
            ui.showSection('upload');
        } finally {
            state.isAnalyzing = false;
        }
    },

    /**
     * 새 분석 시작
     */
    handleNewAnalysis() {
        ui.resetPreview();
        ui.showSection('upload');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /**
     * 히스토리 새로고침
     */
    async refreshHistory() {
        try {
            const detections = await api.getHistory();
            ui.renderHistory(detections);
        } catch (error) {
            console.error('히스토리 로드 오류:', error);
        }
    },

    /**
     * 탐지 결과 삭제
     */
    async deleteDetection(id) {
        try {
            await api.deleteDetection(id);
            await handlers.refreshHistory();

            // 현재 보고 있는 결과가 삭제된 경우 업로드 화면으로 이동
            if (state.currentDetection && state.currentDetection.id === id) {
                state.currentDetection = null;
                ui.showSection('upload');
            }
        } catch (error) {
            console.error('삭제 오류:', error);
            ui.showToast(error.message, 'error');
        }
    }
};

// ===== 이벤트 리스너 등록 =====
function initEventListeners() {
    // 업로드 영역 클릭
    elements.uploadArea.addEventListener('click', () => {
        if (!state.selectedFile) {
            elements.fileInput.click();
        }
    });

    // 파일 선택
    elements.fileInput.addEventListener('change', handlers.handleFileSelect);

    // 드래그 앤 드롭
    elements.uploadArea.addEventListener('dragover', handlers.handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handlers.handleDragLeave);
    elements.uploadArea.addEventListener('drop', handlers.handleDrop);

    // 미리보기 제거
    elements.removePreview.addEventListener('click', (e) => {
        e.stopPropagation();
        ui.resetPreview();
    });

    // 분석 시작
    elements.analyzeBtn.addEventListener('click', handlers.handleAnalyze);

    // 새 분석
    elements.newAnalysisBtn.addEventListener('click', handlers.handleNewAnalysis);

    // 히스토리 새로고침
    elements.refreshHistoryBtn.addEventListener('click', handlers.refreshHistory);

    // 이미지 클릭 시 모달
    elements.originalImage.addEventListener('click', () => {
        ui.showModal(elements.originalImage.src);
    });
    elements.resultImage.addEventListener('click', () => {
        ui.showModal(elements.resultImage.src);
    });

    // 모달 닫기
    elements.modalClose.addEventListener('click', ui.closeModal);
    elements.modalOverlay.addEventListener('click', ui.closeModal);

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            ui.closeModal();
        }
    });
}

// ===== 앱 초기화 =====
async function initApp() {
    console.log('🚗 스마트 주차장 차량 카운팅 앱 시작');

    // 이벤트 리스너 등록
    initEventListeners();

    // 히스토리 로드
    await handlers.refreshHistory();

    console.log('✅ 앱 초기화 완료');
}

// DOM 로드 후 앱 시작
document.addEventListener('DOMContentLoaded', initApp);
