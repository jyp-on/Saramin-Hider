// 숨긴 공고 목록을 저장하고 불러오는 함수
function saveHiddenJobs(hiddenJobs) {
    chrome.storage.local.set({ 'hiddenJobs': hiddenJobs });
}

function loadHiddenJobs(callback) {
    chrome.storage.local.get('hiddenJobs', function(result) {
        callback(result.hiddenJobs || []);
    });
}

// X 버튼 추가 및 이벤트 처리
function addHideButtons() {
    const jobItems = document.querySelectorAll('.list_item');
    
    jobItems.forEach(item => {
        const companyNm = item.querySelector('.company_nm');
        const titleElement = item.querySelector('.job_tit .str_tit span');
        const companyNameElement = item.querySelector('.company_nm a') || item.querySelector('.company_nm span.str_tit');
        
        if (!companyNm || !titleElement || !companyNameElement) return;
        
        const jobTitle = titleElement.innerText;
        const companyName = companyNameElement.innerText.trim();
        
        const hideButton = document.createElement('button');
        hideButton.innerHTML = '✕ 숨기기';
        hideButton.className = 'hide-job-button';
        
        hideButton.addEventListener('click', () => {
            item.style.display = 'none';
            
            loadHiddenJobs(hiddenJobs => {
                hiddenJobs.push({
                    title: jobTitle,
                    company: companyName
                });
                saveHiddenJobs(hiddenJobs);
            });
        });
        
        companyNm.style.position = 'relative';
        companyNm.appendChild(hideButton);
    });
}

// 페이지 로드시 숨겨진 공고 적용
function applyHiddenJobs() {
    loadHiddenJobs(hiddenJobs => {
        const jobItems = document.querySelectorAll('.list_item');
        
        jobItems.forEach(item => {
            const titleElement = item.querySelector('.job_tit .str_tit span');
            if (!titleElement) return;
            
            const jobTitle = titleElement.innerText;
            if (hiddenJobs.some(job => job.title === jobTitle)) {
                item.style.display = 'none';
            }
        });
    });
}

// 실행
window.onload = function() {
    setTimeout(() => {
        addHideButtons();
        applyHiddenJobs();
    }, 100); // 페이지가 완전히 로드된 후 0.1초 후에 실행
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'RESTORE_JOB') {
        const jobItems = document.querySelectorAll('.list_item');
        
        jobItems.forEach(item => {
            const titleElement = item.querySelector('.job_tit .str_tit span');
            if (!titleElement) return;
            
            const jobTitle = titleElement.innerText;
            if (jobTitle === message.jobTitle) {
                item.style.display = '';
            }
        });
    } else if (message.type === 'RESTORE_ALL_JOBS') {
        document.querySelectorAll('.list_item').forEach(item => {
            item.style.display = '';
        });
    }
});