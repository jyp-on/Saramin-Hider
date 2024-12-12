async function restoreAllJobs() {
    // 현재 활성화된 탭 가져오기
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    // 스토리지 비우기
    await chrome.storage.local.set({ 'hiddenJobs': [] });
    
    // 현재 페이지의 모든 숨겨진 공고 보이기
    await chrome.tabs.sendMessage(tab.id, {
        type: 'RESTORE_ALL_JOBS'
    });
    
    // 팝업 목록 새로고침
    displayHiddenJobs();
}

function displayHiddenJobs() {
    const listElement = document.getElementById('hiddenJobsList');
    
    chrome.storage.local.get('hiddenJobs', function(result) {
        const hiddenJobs = result.hiddenJobs || [];
        
        if (hiddenJobs.length === 0) {
            listElement.innerHTML = '<div class="no-items">숨긴 채용공고가 없습니다.</div>';
            document.getElementById('restoreAllButton').style.display = 'none';
            return;
        }
        
        document.getElementById('restoreAllButton').style.display = 'block';
        
        listElement.innerHTML = hiddenJobs.map(job => `
            <div class="hidden-job-item">
                <div class="job-info">
                    <div class="company-name">${job.company}</div>
                    <div class="job-title">${job.title}</div>
                </div>
                <button class="restore-button" data-job="${job.title}">복원</button>
            </div>
        `).join('');
        
        // 복원 버튼 이벤트 처리
        document.querySelectorAll('.restore-button').forEach(button => {
            button.addEventListener('click', async function() {
                const jobTitle = this.getAttribute('data-job');
                const newHiddenJobs = hiddenJobs.filter(job => job.title !== jobTitle);
                
                await chrome.storage.local.set({ 'hiddenJobs': newHiddenJobs });
                
                const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
                await chrome.tabs.sendMessage(tab.id, {
                    type: 'RESTORE_JOB',
                    jobTitle: jobTitle
                });
                
                displayHiddenJobs();
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    displayHiddenJobs();
    document.getElementById('restoreAllButton').addEventListener('click', restoreAllJobs);
});
