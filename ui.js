// ========================================
// UI FUNCTIONS
// ========================================

// Loading Functions
function showLoading(text = 'Memproses...') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loading').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading').classList.remove('active');
    document.getElementById('progressBar').style.display = 'none';
}

function updateProgress(percent) {
    document.getElementById('progressBar').style.display = 'block';
    document.getElementById('progressFill').style.width = percent + '%';
}

// ========================================
// FILE RENDERING
// ========================================

function renderFiles() {
    const grid = document.getElementById('filesGrid');
    grid.innerHTML = '';
    
    if (files.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div style="font-size: 64px; margin-bottom: 16px;">📂</div>
                <div style="font-size: 16px; margin-bottom: 8px;">Belum ada file</div>
                <div style="font-size: 14px;">Upload file pertama Anda sekarang!</div>
            </div>
        `;
        return;
    }
    
    files.forEach(file => {
        const card = document.createElement('div');
        card.className = 'file-card';
        
        const statusIcon = file.savedTo.includes('local') && file.savedTo.includes('cloud') ? '🔄' :
                          file.savedTo.includes('cloud') ? '☁️' : '💻';
        
        const icon = getFileIcon(file.type, file.name);
        
        card.innerHTML = `
            <div class="file-status" title="${file.savedTo.join(' + ')}">${statusIcon}</div>
            <div class="file-icon">${icon}</div>
            <div class="file-name" title="${file.name}">${file.name}</div>
            <div class="file-info">
                <span>${formatFileSize(file.size)}</span>
                <span>${file.savedTo.join(' + ')}</span>
            </div>
            <div class="file-actions">
                <button class="action-btn" onclick="downloadFile('${file.id}')">📥</button>
                ${file.cloudUrl ? `<button class="action-btn" onclick="shareFile('${file.id}')">🔗</button>` : ''}
                <button class="action-btn" onclick="deleteFile('${file.id}')">🗑️</button>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function getFileIcon(type, name) {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf') || name.endsWith('.pdf')) return '📕';
    if (type.includes('video')) return '🎬';
    if (type.includes('audio')) return '🎵';
    if (name.endsWith('.zip') || name.endsWith('.rar')) return '📦';
    if (name.endsWith('.doc') || name.endsWith('.docx')) return '📝';
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return '📊';
    if (name.endsWith('.ppt') || name.endsWith('.pptx')) return '📽️';
    if (name.endsWith('.txt')) return '📄';
    if (name.endsWith('.json')) return '📋';
    if (name.endsWith('.html') || name.endsWith('.htm')) return '🌐';
    if (name.endsWith('.css')) return '🎨';
    if (name.endsWith('.js')) return '📜';
    if (name.endsWith('.py')) return '🐍';
    if (name.endsWith('.java')) return '☕';
    return '📄';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // File Input
    document.getElementById('fileInput').addEventListener('change', (e) => {
        handleFileUpload(e.target.files);
        e.target.value = '';
    });

    // Drag and Drop
    const dropZone = document.getElementById('dropZone');
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFileUpload(e.dataTransfer.files);
    });

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            // TODO: Implement filtering
            renderFiles();
        });
    });
}

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', setupEventListeners);
