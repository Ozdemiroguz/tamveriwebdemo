// Utility functions for common operations - CDN Version
/**
 * URL parametrelerini alır
 */
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        uid: params.get('uid'),
        appKey: params.get('appKey')
    };
}

/**
 * Hata mesajını gösterir
 */
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');

        // 5 saniye sonra hata mesajını gizle
        setTimeout(() => {
            errorElement.classList.remove('show');
        }, 5000);
    }
}

/**
 * Hata mesajını gizler
 */
function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.remove('show');
    }
}

/**
 * Loading durumunu gösterir/gizler
 */
function showLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Butona loading durumunu ekler/kaldırır
 */
function setButtonLoading(buttonId, loading = true) {
    const button = document.getElementById(buttonId);
    if (button) {
        const spinner = button.querySelector('.loading-spinner');
        const text = button.querySelector('.btn-text');

        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
            if (spinner) spinner.style.display = 'block';
            if (text) text.style.opacity = '0';
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            if (spinner) spinner.style.display = 'none';
            if (text) text.style.opacity = '1';
        }
    }
}

/**
 * Tarih formatını düzenler
 */
function formatDate(date) {
    if (!date) return '-';

    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Makine durumunu Türkçe'ye çevirir
 */
function translateStatus(status) {
    const translations = {
        'active': 'Aktif',
        'error': 'Hatalı',
        'maintenance': 'Bakımda',
        'stopped': 'Durdu'
    };
    return translations[status] || status;
}

/**
 * Kullanıcı rolünü Türkçe'ye çevirir
 */
function translateRole(role) {
    const translations = {
        'admin': 'Yönetici',
        'worker': 'Çalışan'
    };
    return translations[role] || role;
}

/**
 * AppKey'i doğrular
 */
async function validateAppKey(appKey) {
    // Bu fonksiyon Firebase Functions ile implement edilmeli
    // Şimdilik basit bir kontrol yapıyoruz
    return appKey === APP_KEY;
}

/**
 * Kullanıcının onaylı olup olmadığını kontrol eder
 */
async function checkUserApproval(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            return userData.isApproved === true;
        }
        return false;
    } catch (error) {
        console.error('User approval check error:', error);
        return false;
    }
}

/**
 * Modal'ı açar
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Modal'ı kapatır
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * Locale ayarlarına göre dil dosyasını yükler
 */
async function loadLocale() {
    try {
        const language = navigator.language.substring(0, 2);
        const supportedLanguages = ['tr', 'en', 'bg'];
        const selectedLanguage = supportedLanguages.includes(language) ? language : 'tr';

        const response = await fetch(`assets/locales/${selectedLanguage}.json`);
        const translations = await response.json();
        return translations;
    } catch (error) {
        console.error('Locale loading error:', error);
        // Fallback olarak Türkçe dil verilerini döndür
        return {
            login: 'Giriş Yap',
            email: 'E-posta',
            password: 'Şifre',
            dashboard: 'Dashboard',
            machines: 'Makineler',
            active: 'Aktif',
            error: 'Hatalı',
            maintenance: 'Bakımda',
            loading: 'Yükleniyor...'
        };
    }
}

/**
 * Debounce function for search
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
