// ========================================
// AUTHENTICATION FUNCTIONS
// ========================================

let auth;
let currentUser = null;

// Initialize Firebase
function initializeFirebase() {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    
    // Auth state listener
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await initDB();
            await loadFiles();
            showApp();
            updateUserInfo(user);
            updateStorageInfo();
        } else {
            currentUser = null;
            showLogin();
        }
    });
}

// Show/Hide Functions
function showLogin() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('appContainer').classList.remove('active');
}

function showApp() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('appContainer').classList.add('active');
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

// Error/Success Messages
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => element.classList.remove('show'), 5000);
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => element.classList.remove('show'), 5000);
}

// Login with Email
async function loginWithEmail() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showError('loginError', 'Email dan password harus diisi!');
        return;
    }

    showLoading('Logging in...');
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        hideLoading();
        let errorMessage = 'Login gagal!';
        switch (error.code) {
            case 'auth/user-not-found': errorMessage = 'Email tidak terdaftar!'; break;
            case 'auth/wrong-password': errorMessage = 'Password salah!'; break;
            case 'auth/invalid-email': errorMessage = 'Format email tidak valid!'; break;
        }
        showError('loginError', errorMessage);
    }
}

// Register with Email
async function registerWithEmail() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    if (!name || !email || !password) {
        showError('registerError', 'Semua field harus diisi!');
        return;
    }

    if (password.length < 6) {
        showError('registerError', 'Password minimal 6 karakter!');
        return;
    }

    showLoading('Creating account...');
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });
        hideLoading();
        showSuccess('registerSuccess', 'Registrasi berhasil!');
    } catch (error) {
        hideLoading();
        let errorMessage = 'Registrasi gagal!';
        switch (error.code) {
            case 'auth/email-already-in-use': errorMessage = 'Email sudah terdaftar!'; break;
            case 'auth/invalid-email': errorMessage = 'Format email tidak valid!'; break;
            case 'auth/weak-password': errorMessage = 'Password terlalu lemah!'; break;
        }
        showError('registerError', errorMessage);
    }
}

// Login with Google
async function loginWithGoogle() {
    showLoading('Connecting to Google...');
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
    } catch (error) {
        hideLoading();
        showError('loginError', 'Login dengan Google gagal!');
    }
}

// Logout
async function logout() {
    if (confirm('Yakin ingin keluar?')) {
        showLoading('Logging out...');
        await auth.signOut();
        hideLoading();
    }
}

// Update User Info
function updateUserInfo(user) {
    const displayName = user.displayName || user.email.split('@')[0];
    document.getElementById('userName').textContent = displayName;
    
    const avatar = document.getElementById('userAvatar');
    if (user.photoURL) {
        avatar.innerHTML = `<img src="${user.photoURL}" alt="${displayName}">`;
    } else {
        avatar.textContent = displayName.charAt(0).toUpperCase();
    }
}

// Keyboard Enter Handler
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm && loginForm.style.display !== 'none') {
            loginWithEmail();
        } else if (registerForm && registerForm.style.display !== 'none') {
            registerWithEmail();
        }
    }
});
