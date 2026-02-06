// ========================================
// STORAGE MANAGEMENT
// ========================================

let db = null;
let files = [];
let storageMode = 'dual'; // dual, local, cloud
let localStorageUsed = 0;
let cloudStorageUsed = 0;

// ========================================
// INDEXEDDB FUNCTIONS
// ========================================

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_FILES)) {
                const store = db.createObjectStore(STORE_FILES, { keyPath: 'id' });
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('uploadDate', 'uploadDate', { unique: false });
            }
        };
    });
}

async function saveFileToIndexedDB(fileData) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_FILES], 'readwrite');
        const store = transaction.objectStore(STORE_FILES);
        const request = store.add(fileData);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function loadFiles() {
    if (!db || !currentUser) return;
    
    const transaction = db.transaction([STORE_FILES], 'readonly');
    const store = transaction.objectStore(STORE_FILES);
    const index = store.index('userId');
    const request = index.getAll(currentUser.uid);
    
    request.onsuccess = () => {
        files = request.result || [];
        renderFiles();
        calculateStorageUsage();
    };
}

async function deleteFileFromDB(fileId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_FILES], 'readwrite');
        const store = transaction.objectStore(STORE_FILES);
        const request = store.delete(fileId);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ========================================
// CLOUDINARY FUNCTIONS
// ========================================

async function uploadToCloudinary(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);
    
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                onProgress(percent);
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                reject(new Error('Upload failed'));
            }
        });
        
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`);
        xhr.send(formData);
    });
}

// ========================================
// FILE UPLOAD HANDLER
// ========================================

async function handleFileUpload(uploadedFiles) {
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    
    for (const file of uploadedFiles) {
        try {
            showLoading(`Uploading ${file.name}...`);
            updateSyncStatus('syncing');
            
            const fileData = {
                id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                userId: currentUser.uid,
                name: file.name,
                size: file.size,
                type: file.type,
                uploadDate: new Date().toISOString(),
                savedTo: []
            };
            
            // Save to IndexedDB (Local)
            if (storageMode === 'dual' || storageMode === 'local') {
                if (localStorageUsed + file.size <= MAX_LOCAL_STORAGE) {
                    const reader = new FileReader();
                    const localData = await new Promise((resolve) => {
                        reader.onload = (e) => resolve(e.target.result);
                        reader.readAsDataURL(file);
                    });
                    
                    fileData.localData = localData;
                    fileData.savedTo.push('local');
                    await saveFileToIndexedDB(fileData);
                    localStorageUsed += file.size;
                } else {
                    hideLoading();
                    alert('Local storage penuh! Coba mode "Cloud Only"');
                    return;
                }
            }
            
            // Upload to Cloudinary (Cloud)
            if (storageMode === 'dual' || storageMode === 'cloud') {
                if (cloudStorageUsed + file.size <= MAX_CLOUD_STORAGE) {
                    try {
                        const cloudResult = await uploadToCloudinary(file, updateProgress);
                        fileData.cloudUrl = cloudResult.secure_url;
                        fileData.cloudPublicId = cloudResult.public_id;
                        fileData.savedTo.push('cloud');
                        cloudStorageUsed += file.size;
                        
                        if (!fileData.localData) {
                            await saveFileToIndexedDB(fileData);
                        }
                    } catch (cloudError) {
                        console.error('Cloudinary error:', cloudError);
                        alert(`Error upload ke cloud: ${cloudError.message}\n\nFile tersimpan di lokal saja.`);
                    }
                } else {
                    alert('Cloud storage penuh! File disimpan di lokal saja.');
                }
            }
            
            files.push(fileData);
            
        } catch (error) {
            console.error('Upload error:', error);
            hideLoading();
            alert(`Error uploading ${file.name}: ${error.message}`);
            return;
        }
    }
    
    hideLoading();
    await loadFiles();
    updateStorageInfo();
    updateSyncStatus('synced');
}

// ========================================
// STORAGE INFO
// ========================================

function calculateStorageUsage() {
    localStorageUsed = files.reduce((sum, f) => sum + (f.localData ? f.size : 0), 0);
    cloudStorageUsed = files.reduce((sum, f) => sum + (f.cloudUrl ? f.size : 0), 0);
}

function updateStorageInfo() {
    const totalUsed = Math.max(localStorageUsed, cloudStorageUsed);
    
    document.getElementById('totalStorage').textContent = 
        `${formatFileSize(totalUsed)} / 45 GB`;
    
    document.getElementById('localStorageText').textContent = 
        `${formatFileSize(localStorageUsed)} / 20 GB`;
    document.getElementById('localStorageFill').style.width = 
        `${(localStorageUsed / MAX_LOCAL_STORAGE) * 100}%`;
    
    document.getElementById('cloudStorageText').textContent = 
        `${formatFileSize(cloudStorageUsed)} / 25 GB`;
    document.getElementById('cloudStorageFill').style.width = 
        `${(cloudStorageUsed / MAX_CLOUD_STORAGE) * 100}%`;
}

function updateSyncStatus(status) {
    const statusEl = document.getElementById('syncStatus');
    
    statusEl.className = 'sync-status';
    
    if (status === 'synced') {
        statusEl.classList.add('synced');
        statusEl.innerHTML = '<span>✅</span><span>Synced</span>';
    } else if (status === 'syncing') {
        statusEl.classList.add('syncing');
        statusEl.innerHTML = '<span>🔄</span><span>Syncing...</span>';
    }
}

// ========================================
// STORAGE MODE
// ========================================

function setStorageMode(mode) {
    storageMode = mode;
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    const modeText = document.getElementById('modeText');
    if (mode === 'dual') {
        modeText.textContent = 'Dual Save (Lokal + Cloud)';
    } else if (mode === 'local') {
        modeText.textContent = 'Local Only';
    } else {
        modeText.textContent = 'Cloud Only';
    }
}

// ========================================
// FILE ACTIONS
// ========================================

async function downloadFile(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    const a = document.createElement('a');
    
    if (file.localData) {
        a.href = file.localData;
    } else if (file.cloudUrl) {
        a.href = file.cloudUrl;
    }
    
    a.download = file.name;
    a.click();
}

function shareFile(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file || !file.cloudUrl) return;
    
    navigator.clipboard.writeText(file.cloudUrl);
    alert('Link copied to clipboard!\n\n' + file.cloudUrl);
}

async function deleteFile(fileId) {
    if (!confirm('Hapus file ini?')) return;
    
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return;
    
    await deleteFileFromDB(fileId);
    files.splice(fileIndex, 1);
    
    renderFiles();
    calculateStorageUsage();
    updateStorageInfo();
}
