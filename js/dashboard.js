// Dashboard page main script - CDN Version

// Global state
let currentUser = null;
let currentWorkplace = null;
let allMachines = [];
let filteredMachines = [];
let machineStatsData = null;
let machineUpdateListener = null;

// DOM yüklendiğinde çalışacak fonksiyon
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard initialized');

    showLoading(true);

    try {
        // Auth durumunu kontrol et
        await initializeDashboard();

        // Event listener'ları ekle
        setupEventListeners();

    } catch (error) {
        console.error('Dashboard initialization error:', error);
        alert('Dashboard yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
        showLoading(false);
    }
});

/**
 * Dashboard'u başlatır
 */
async function initializeDashboard() {
    // URL parametrelerini kontrol et (mobil erişim)
    const { uid, appKey } = getUrlParams();
    const isMobileAccess = uid && appKey;

    let userId;

    if (isMobileAccess) {
        console.log('Mobile access detected');
        // Mobil erişim kontrolü
        try {
            const validation = await validateMobileAccess();
            if (!validation.success) {
                console.error('Mobile validation failed:', validation.error);
                alert(validation.error);
                return; // Yönlendirme yapmak yerine sadece return
            }
            userId = uid;
            console.log('Mobile access validated for user:', userId);
        } catch (error) {
            console.error('Mobile validation error:', error);
            alert('Mobil erişim doğrulamasında hata oluştu.');
            return;
        }

        // Mobil parametreleri aldıktan sonra URL'den sil
        if (uid && appKey && window.history.replaceState) {
            const url = new URL(window.location);
            url.searchParams.delete('uid');
            url.searchParams.delete('appKey');
            window.history.replaceState({}, document.title, url.pathname);
        }
    } else {
        console.log('Web access detected');
        // Normal web erişimi - auth state'in yüklenmesini bekle
        return new Promise((resolve) => {
            const unsubscribe = window.auth.onAuthStateChanged((user) => {
                unsubscribe();
                if (user) {
                    console.log('User authenticated:', user.uid);
                    resolve(continueInitialization(user.uid));
                } else {
                    console.log('User not authenticated, redirecting to login');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                    resolve();
                }
            });
        });
    }

    return continueInitialization(userId);
}

/**
 * Kullanıcı ID'si ile dashboard yüklemeye devam eder
 */
async function continueInitialization(userId) {
    try {
        console.log('Continuing initialization for user:', userId);

        // Kullanıcı verilerini al
        const userResult = await getUserData(userId);
        if (!userResult.success) {
            console.error('User data error:', userResult.error);
            alert(userResult.error);
            return;
        }

        currentUser = userResult.user;
        console.log('User data loaded:', currentUser.fullName);

        // Kullanıcının onaylı olup olmadığını kontrol et
        if (!currentUser.isApproved) {
            alert('Hesabınız henüz onaylanmamış. Lütfen yöneticinizle iletişime geçin.');
            // Mobil erişimde logout yapmaya gerek yok
            const { uid, appKey } = getUrlParams();
            const isMobileAccess = uid && appKey;
            if (!isMobileAccess) {
                await logout();
            }
            window.location.href = 'index.html';
            return;
        }

        // Workplace verilerini al
        const workplaceResult = await getWorkplaceData(currentUser.workplaceId);
        if (!workplaceResult.success) {
            console.error('Workplace data error:', workplaceResult.error);
            alert(workplaceResult.error);
            return;
        }

        currentWorkplace = workplaceResult.workplace;
        console.log('Workplace data loaded:', currentWorkplace.name);

        // UI'ı güncelle
        updateUserInterface();

        // Makine verilerini yükle
        await loadMachineData();

        // Admin ise kullanıcı verilerini yükle
        if (currentUser.role === 'admin') {
            await loadUserData();
        }

        console.log('Dashboard initialization completed successfully');
        return true;

    } catch (error) {
        console.error('Dashboard initialization error:', error);
        alert('Dashboard başlatılırken hata oluştu: ' + error.message);
        return false;
    }
}

/**
 * Kullanıcı arayüzünü günceller
 */
function updateUserInterface() {
    // Kullanıcı bilgilerini göster
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement) {
        userInfoElement.textContent = `${currentUser.fullName} (${translateRole(currentUser.role)})`;
    }

    // Workplace adını göster
    const workplaceNameElement = document.getElementById('workplaceName');
    if (workplaceNameElement) {
        workplaceNameElement.textContent = currentWorkplace.name;
    }

    // Admin olmayan kullanıcılar için kullanıcı yönetimi bölümünü gizle
    if (currentUser.role !== 'admin') {
        const usersSection = document.getElementById('usersSection');
        if (usersSection) {
            usersSection.style.display = 'none';
        }
    }
}

/**
 * Makine verilerini yükler
 */
async function loadMachineData() {
    try {
        let machines;

        if (currentUser.role === 'admin') {
            // Admin tüm makineleri görebilir
            machines = await getMachines(currentUser.workplaceId);
        } else {
            // Worker sadece atanmış makineleri görebilir
            machines = await getUserAssignedMachines(currentUser.workplaceId, currentUser.id);
        }

        allMachines = machines;
        filteredMachines = [...allMachines];

        // İstatistikleri güncelle
        updateMachineStats();

        // Makine listesini render et
        renderMachines();

        // Gerçek zamanlı güncellemeleri başlat
        setupRealTimeUpdates();

    } catch (error) {
        console.error('Load machine data error:', error && error.message ? error.message : error);
    }
}

/**
 * Kullanıcı verilerini yükler (Admin only)
 */
async function loadUserData() {
    try {
        const usersResult = await getWorkplaceUsers(currentUser.workplaceId);

        if (usersResult.success) {
            renderUsers(usersResult.users);

            // Kullanıcı yönetimi bölümünü göster
            const usersSection = document.getElementById('usersSection');
            if (usersSection) {
                usersSection.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Load user data error:', error);
    }
}

/**
 * Makine istatistiklerini günceller
 */
function updateMachineStats() {
    machineStatsData = getMachineStatistics(allMachines);

    // DOM elementlerini güncelle
    const activeMachinesElement = document.getElementById('activeMachines');
    const errorMachinesElement = document.getElementById('errorMachines');
    const maintenanceMachinesElement = document.getElementById('maintenanceMachines');

    if (activeMachinesElement) activeMachinesElement.textContent = machineStatsData.active;
    if (errorMachinesElement) errorMachinesElement.textContent = machineStatsData.error;
    if (maintenanceMachinesElement) maintenanceMachinesElement.textContent = machineStatsData.maintenance;
}

/**
 * Makineleri render eder
 */
function renderMachines() {
    const machinesGrid = document.getElementById('machinesGrid');
    if (!machinesGrid) return;

    if (filteredMachines.length === 0) {
        machinesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;">
                <p>Gösterilecek makine bulunamadı.</p>
            </div>
        `;
        return;
    }

    machinesGrid.innerHTML = filteredMachines.map(machine => `
        <div class="machine-card ${machine.status}" data-machine-id="${machine.id}">
            <div class="machine-header">
                <h3 class="machine-title">${machine.name}</h3>
                <span class="machine-status ${machine.status}">${translateStatus(machine.status)}</span>
            </div>
            
            <p class="machine-description">${machine.description || 'Açıklama yok'}</p>
            
            <div class="machine-footer">
                <span class="machine-assigned ${machine.assignedUserIds && machine.assignedUserIds.includes(currentUser.id) ? 'assigned' : ''}">
                    ${machine.assignedUserIds && machine.assignedUserIds.includes(currentUser.id) ? '✓ Atanmış' : '○ Atanmamış'}
                </span>
                <span class="machine-time">${formatDate(machine.updatedAt || machine.createdAt)}</span>
            </div>
        </div>
    `).join('');

    // Makine kartlarına click event'i ekle
    const machineCards = machinesGrid.querySelectorAll('.machine-card');
    machineCards.forEach(card => {
        card.addEventListener('click', () => {
            const machineId = card.dataset.machineId;
            showMachineDetails(machineId);
        });
    });
}

/**
 * Kullanıcıları render eder (Admin only)
 */
function renderUsers(users) {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;

    usersList.innerHTML = users.map(user => `
        <div class="user-item">
            <div class="user-info">
                <div class="user-name">${user.fullName}</div>
                <div class="user-role">${translateRole(user.role)}</div>
            </div>
            <div class="user-actions">
                ${!user.isApproved ? `
                    <button class="user-btn approve" onclick="approveUser('${user.id}')">Onayla</button>
                    <button class="user-btn reject" onclick="rejectUser('${user.id}')">Reddet</button>
                ` : `
                    <span style="color: #28a745; font-weight: 600;">✓ Onaylı</span>
                `}
            </div>
        </div>
    `).join('');
}

/**
 * Makine detaylarını gösterir
 */
async function showMachineDetails(machineId) {
    try {
        showLoading(true);

        const machineResult = await getMachineDetails(currentUser.workplaceId, machineId);

        if (!machineResult.success) {
            alert(machineResult.error);
            return;
        }

        const machine = machineResult.machine;

        // Modal içeriğini oluştur
        const modalTitle = document.getElementById('modalMachineTitle');
        const modalBody = document.getElementById('modalMachineBody');

        if (modalTitle) modalTitle.textContent = machine.name;

        if (modalBody) {
            modalBody.innerHTML = `
                <div class="machine-detail">
                    <div class="detail-section">
                        <h4>Genel Bilgiler</h4>
                        <div class="detail-item">
                            <span class="detail-label">Durum:</span>
                            <span class="detail-value">
                                <span class="machine-status ${machine.status}">${translateStatus(machine.status)}</span>
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Açıklama:</span>
                            <span class="detail-value">${machine.description || 'Açıklama yok'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">İpuçları:</span>
                            <span class="detail-value">${machine.tips || 'İpucu yok'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Oluşturma Tarihi:</span>
                            <span class="detail-value">${formatDate(machine.createdAt)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Son Güncelleme:</span>
                            <span class="detail-value">${formatDate(machine.updatedAt || machine.createdAt)}</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Atama Bilgileri</h4>
                        <div class="detail-item">
                            <span class="detail-label">Atanmış Kullanıcı Sayısı:</span>
                            <span class="detail-value">${machine.assignedUserIds ? machine.assignedUserIds.length : 0}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Size Atanmış:</span>
                            <span class="detail-value">
                                ${machine.assignedUserIds && machine.assignedUserIds.includes(currentUser.id) ? '✓ Evet' : '✗ Hayır'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Modal'ı aç
        openModal('machineModal');

    } catch (error) {
        console.error('Show machine details error:', error);
        alert('Makine detayları alınırken hata oluştu.');
    } finally {
        showLoading(false);
    }
}

/**
 * Gerçek zamanlı güncellemeleri başlatır
 */
function setupRealTimeUpdates() {
    // Önceki listener'ı kapat
    if (machineUpdateListener) {
        machineUpdateListener();
    }

    if (currentUser.role === 'admin') {
        // Admin tüm makine güncellemelerini dinler
        machineUpdateListener = listenToMachineUpdates(currentUser.workplaceId, handleMachineUpdates);
    } else {
        // Worker sadece kendi makinelerini bir defa çeker
        getUserAssignedMachines(currentUser.workplaceId, currentUser.id)
            .then(machines => handleMachineUpdates(machines))
            .catch(error => handleMachineUpdates([], error));
    }
}

/**
 * Makine güncellemelerini işler
 */
function handleMachineUpdates(machines, error) {
    if (error) {
        console.error('Machine updates error:', error);
        return;
    }

    if (machines) {
        allMachines = machines;

        // Mevcut filtreyi uygula
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        filteredMachines = filterMachinesByStatus(allMachines, activeFilter);

        // UI'ı güncelle
        updateMachineStats();
        renderMachines();
    }
}

/**
 * Event listener'ları kurar
 */
function setupEventListeners() {
    // Logout butonu
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Filter butonları
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Aktif filtreyi güncelle
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Makineleri filtrele
            const filter = e.target.dataset.filter;
            filteredMachines = filterMachinesByStatus(allMachines, filter);
            renderMachines();
        });
    });

    // Modal kapatma
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            closeModal('machineModal');
        });
    }

    // Modal dışına tıklayınca kapatma
    const modal = document.getElementById('machineModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal('machineModal');
            }
        });
    }
}

/**
 * Logout işleyicisi
 */
async function handleLogout() {
    try {
        showLoading(true);

        // Gerçek zamanlı dinleyiciyi kapat
        if (machineUpdateListener) {
            machineUpdateListener();
        }

        // Logout yap (mobil erişimde Firebase logout yapmaya gerek yok)
        const { uid, appKey } = getUrlParams();
        const isMobileAccess = uid && appKey;

        if (!isMobileAccess) {
            await logout();
        }

        // Ana sayfaya yönlendir
        window.location.href = 'index.html';

    } catch (error) {
        console.error('Logout error:', error);
        alert('Çıkış yapılırken hata oluştu.');
    } finally {
        showLoading(false);
    }
}

// Global fonksiyonlar (HTML'den çağrılmak için)
window.approveUser = async function (userId) {
    // Bu fonksiyon implement edilecek
    console.log('Approve user:', userId);
};

window.rejectUser = async function (userId) {
    // Bu fonksiyon implement edilecek
    console.log('Reject user:', userId);
};
