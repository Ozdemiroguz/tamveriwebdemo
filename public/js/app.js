// Main app entry point for login page - CDN Version
// DOM yüklendiğinde çalışacak fonksiyon
document.addEventListener('DOMContentLoaded', () => {
    console.log('Login page initialized');

    // Sadece login sayfasında auth kontrolü yap
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/');

    if (isLoginPage) {
        // Zaten giriş yapmış kullanıcıyı dashboard'a yönlendir
        const currentUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
        if (currentUser) {
            console.log('User already logged in, redirecting to dashboard');
            window.location.href = 'dashboard.html';
            return;
        }

        // Auth state değişikliklerini dinle (sadece login sayfasında)
        if (typeof auth !== 'undefined') {
            auth.onAuthStateChanged((user) => {
                if (user) {
                    console.log('User logged in, redirecting to dashboard');
                    window.location.href = 'dashboard.html';
                }
            });
        } else {
            console.error('auth globali tanımlı değil!');
        }
    }

    // Login form event listener'ı ekle
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

/**
 * Login form submit işleyicisi
 */
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Basit validasyon
    if (!email || !password) {
        showError('errorMessage', 'Lütfen e-posta ve şifre alanlarını doldurun.');
        return;
    }

    if (!isValidEmail(email)) {
        showError('errorMessage', 'Lütfen geçerli bir e-posta adresi girin.');
        return;
    }

    // Hata mesajını gizle
    hideError('errorMessage');

    // Loading durumunu göster
    setButtonLoading('loginBtn', true);

    try {
        const result = await loginWithEmail(email, password);

        if (result.success) {
            // Giriş başarılı, dashboard'a yönlendir
            window.location.href = 'dashboard.html';
        } else {
            // Hata mesajını göster
            showError('errorMessage', result.error);
        }
    } catch (error) {
        console.error('Login form error:', error);
        showError('errorMessage', 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
        // Loading durumunu kaldır
        setButtonLoading('loginBtn', false);
    }
}

/**
 * E-posta format kontrolü
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Form alanlarının focus ve blur olayları
 */
document.addEventListener('DOMContentLoaded', () => {
    // Input focus efektleri
    const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');

    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });

        // Sayfa yüklendiğinde dolu alanları kontrol et
        if (input.value) {
            input.parentElement.classList.add('focused');
        }
    });

    // Enter tuşu ile form submit
    document.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            const loginForm = document.getElementById('loginForm');
            if (loginForm && document.activeElement.closest('form') === loginForm) {
                loginForm.dispatchEvent(new Event('submit'));
            }
        }
    });
});
