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
            updateTotalJobCount(-1);  // 숨기기 버튼 클릭시 -1
            
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

// popup에서 보내는 메시지 수신 처리
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'RESTORE_JOB') {
        const jobItems = document.querySelectorAll('.list_item');
        updateTotalJobCount(+1);
        
        jobItems.forEach(item => {
            const titleElement = item.querySelector('.job_tit .str_tit span');
            if (!titleElement) return;
            
            const jobTitle = titleElement.innerText;
            if (jobTitle === message.jobTitle) {
                item.style.display = '';
            }
        });
    } else if (message.type === 'RESTORE_ALL_JOBS') {
        const hiddenJobs = document.querySelectorAll('.list_item[style*="display: none"]');
        const hiddenCount = hiddenJobs.length;  // 숨겨진 공고 개수
        
        document.querySelectorAll('.list_item').forEach(item => {
            item.style.display = '';
        });
        
        // 숨겨진 공고 개수만큼 카운트 증가
        updateTotalJobCount(+hiddenCount);
    }
});

function updateTotalJobCount(count) {
    const totalCountElement = document.querySelector('.total_count em');
    if (!totalCountElement) return;

    const originalCount = parseInt(totalCountElement.textContent);
    totalCountElement.textContent = `${parseInt(originalCount + count)}`;

    // 숨김 건수 표시 업데이트
    const parentElement = totalCountElement.parentElement;
    let hiddenCountSpan = parentElement.querySelector('.hidden-count');
    if (hiddenCountSpan) {
        const currentHiddenCount = parseInt(hiddenCountSpan.textContent.match(/\d+/)[0]);
        hiddenCountSpan.textContent = `(${currentHiddenCount - count}건 숨김)`;
    }
}

// 첫 로드 시 숨긴 공고 개수를 전체 건수에서 제외하여 표시하는 함수
function LoadTotalJobCount() {
    const totalCountElement = document.querySelector('.total_count em');
    if (!totalCountElement) return;

    loadHiddenJobs(hiddenJobs => {
        const jobItems = document.querySelectorAll('.list_item');
        let hiddenJobsCount = 0;
        
        jobItems.forEach(item => {
            const titleElement = item.querySelector('.job_tit .str_tit span');
            if (!titleElement) return;
            
            const jobTitle = titleElement.innerText;
            if (hiddenJobs.some(job => job.title === jobTitle)) {
                hiddenJobsCount++;
            }
        });

        const originalCount = parseInt(totalCountElement.textContent);
        const newCount = originalCount - hiddenJobsCount;
        
        totalCountElement.textContent = `${newCount}`;
        
        const parentElement = totalCountElement.parentElement;
        let hiddenCountSpan = parentElement.querySelector('.hidden-count');
        if (!hiddenCountSpan) {
            hiddenCountSpan = document.createElement('span');
            hiddenCountSpan.className = 'hidden-count';
            hiddenCountSpan.style.color = '#999';
            hiddenCountSpan.style.marginLeft = '5px';
            parentElement.appendChild(hiddenCountSpan);
        }
        hiddenCountSpan.textContent = `(${hiddenJobsCount}건 숨김)`;
    });
}

// 페이지 로드 시 초기화
window.onload = function() {
    setTimeout(() => {
        addHideButtons();
        applyHiddenJobs();
        LoadTotalJobCount();
    }, 100); // 페이지가 완전히 로드된 후 0.1초 후에 실행
}