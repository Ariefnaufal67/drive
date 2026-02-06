// ========================================
// FIREBASE CONFIGURATION
// ========================================

const firebaseConfig = {
    apiKey: "AIzaSyAiPjjP94eds3JVC0MIDrm79V2qhU46kSM",
    authDomain: "drive-821fb.firebaseapp.com",
    projectId: "drive-821fb",
    storageBucket: "drive-821fb.firebasestorage.app",
    messagingSenderId: "873898013807",
    appId: "1:873898013807:web:87609ec9d2b4dfe4c3099a"
};

// ========================================
// CLOUDINARY CONFIGURATION
// ========================================

const CLOUDINARY_CONFIG = {
    cloudName: 'dzjm6qbij',
    apiKey: '837788525812616',
    uploadPreset: 'ml_default' // Pastikan sudah dibuat di Cloudinary Console
};

// ========================================
// STORAGE LIMITS
// ========================================

const MAX_LOCAL_STORAGE = 20 * 1024 * 1024 * 1024; // 20 GB
const MAX_CLOUD_STORAGE = 25 * 1024 * 1024 * 1024; // 25 GB

// ========================================
// DATABASE CONFIGURATION
// ========================================

const DB_NAME = 'MyDriveProDB';
const DB_VERSION = 1;
const STORE_FILES = 'files';
