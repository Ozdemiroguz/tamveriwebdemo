// Authentication service - CDN Version
/**
 * Email ve şifre ile giriş yapar
 */
async function loginWithEmail(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return {
            success: true,
            user: userCredential.user
        };
    } catch (error) {
        console.error('Login error:', error);

        let message = 'Giriş yapılırken bir hata oluştu.';
        switch (error.code) {
            case 'auth/user-not-found':
                message = 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.';
                break;
            case 'auth/wrong-password':
                message = 'Hatalı şifre girdiniz.';
                break;
            case 'auth/invalid-email':
                message = 'Geçersiz e-posta adresi.';
                break;
            case 'auth/user-disabled':
                message = 'Bu hesap devre dışı bırakılmış.';
                break;
            case 'auth/too-many-requests':
                message = 'Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.';
                break;
            case 'auth/network-request-failed':
                message = 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.';
                break;
        }

        return {
            success: false,
            error: message
        };
    }
}

/**
 * Çıkış yapar
 */
async function logout() {
    try {
        await auth.signOut();
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return {
            success: false,
            error: 'Çıkış yapılırken bir hata oluştu.'
        };
    }
}

/**
 * Mobil uygulama üzerinden gelen parametrelerle giriş doğrular
 */
async function validateMobileAccess() {
    const { uid, appKey } = getUrlParams();

    if (!uid || !appKey) {
        return {
            success: false,
            error: 'Geçersiz erişim parametreleri.'
        };
    }

    // AppKey'i doğrula
    const isValidKey = await validateAppKey(appKey);
    if (!isValidKey) {
        return {
            success: false,
            error: 'Geçersiz erişim anahtarı.'
        };
    }

    // Kullanıcının onaylı olup olmadığını kontrol et
    const isApproved = await checkUserApproval(uid);
    if (!isApproved) {
        return {
            success: false,
            error: 'Hesabınız henüz onaylanmamış. Lütfen yöneticinizle iletişime geçin.'
        };
    }

    return {
        success: true,
        uid: uid
    };
}

/**
 * Auth durumunu dinler
 */
function onAuthStateChange(callback) {
    return auth.onAuthStateChanged(callback);
}

/**
 * Mevcut kullanıcıyı döndürür
 */
function getCurrentUser() {
    return (typeof auth !== 'undefined' ? auth.currentUser : null);
}

/**
 * Giriş durumunu kontrol eder ve gerekli yönlendirmeleri yapar
 */
function checkAuthAndRedirect() {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/');
    const isDashboardPage = currentPath.includes('dashboard.html');

    // URL parametrelerini kontrol et (mobil erişim)
    const { uid, appKey } = getUrlParams();
    const isMobileAccess = uid && appKey;

    // Auth state değişikliklerini sadece bir kez dinle
    let authChecked = false;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
        // Sadece ilk kontrolde çalıştır
        if (authChecked) return;
        authChecked = true;

        console.log('Auth state check:', { user: !!user, isLoginPage, isDashboardPage, isMobileAccess });

        if (isMobileAccess) {
            // Mobil erişim durumu
            try {
                const validation = await validateMobileAccess();

                if (validation.success) {
                    if (isLoginPage) {
                        console.log('Mobile access: redirecting to dashboard');
                        window.location.href = 'dashboard.html' + window.location.search;
                    }
                } else {
                    console.log('Mobile access validation failed:', validation.error);
                    alert(validation.error);
                    // Parametreleri temizle ve ana sayfaya yönlendir
                    window.location.href = 'index.html';
                }
            } catch (error) {
                console.error('Mobile access validation error:', error);
            }
        } else {
            // Normal web erişimi
            if (user) {
                // Kullanıcı giriş yapmış
                if (isLoginPage) {
                    console.log('User logged in: redirecting to dashboard');
                    window.location.href = 'dashboard.html';
                }
            } else {
                // Kullanıcı giriş yapmamış
                if (isDashboardPage) {
                    console.log('User not logged in: redirecting to login');
                    window.location.href = 'index.html';
                }
            }
        }

        // Listener'ı kapat
        unsubscribe();
    });
}
