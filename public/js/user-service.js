// User service for managing user data - CDN Version
/**
 * Kullanıcı verilerini getirir
 */
async function getUserData(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            return {
                success: true,
                user: {
                    id: userDoc.id,
                    ...userData
                }
            };
        } else {
            return {
                success: false,
                error: 'Kullanıcı bulunamadı.'
            };
        }
    } catch (error) {
        console.error('Get user data error:', error);
        return {
            success: false,
            error: 'Kullanıcı verileri alınırken hata oluştu.'
        };
    }
}

/**
 * Workplace verilerini getirir
 */
async function getWorkplaceData(workplaceId) {
    try {
        const workplaceDoc = await db.collection('workplaces').doc(workplaceId).get();

        if (workplaceDoc.exists) {
            const workplaceData = workplaceDoc.data();
            return {
                success: true,
                workplace: {
                    id: workplaceDoc.id,
                    ...workplaceData
                }
            };
        } else {
            return {
                success: false,
                error: 'İşyeri bulunamadı.'
            };
        }
    } catch (error) {
        console.error('Get workplace data error:', error);
        return {
            success: false,
            error: 'İşyeri verileri alınırken hata oluştu.'
        };
    }
}

/**
 * İşyerindeki tüm kullanıcıları getirir (Admin only)
 */
async function getWorkplaceUsers(workplaceId) {
    try {
        const usersQuery = db.collection('users').where('workplaceId', '==', workplaceId);
        const querySnapshot = await usersQuery.get();
        const users = [];

        querySnapshot.forEach((doc) => {
            users.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return {
            success: true,
            users: users
        };
    } catch (error) {
        console.error('Get workplace users error:', error);
        return {
            success: false,
            error: 'Kullanıcı listesi alınırken hata oluştu.'
        };
    }
}

/**
 * Kullanıcı onay durumunu günceller (Admin only)
 */
async function updateUserApproval(userId, isApproved) {
    try {
        await db.collection('users').doc(userId).update({
            isApproved: isApproved,
            updatedAt: new Date()
        });

        return {
            success: true,
            message: `Kullanıcı ${isApproved ? 'onaylandı' : 'reddedildi'}.`
        };
    } catch (error) {
        console.error('Update user approval error:', error);
        return {
            success: false,
            error: 'Kullanıcı durumu güncellenirken hata oluştu.'
        };
    }
}

/**
 * Kullanıcının makine atamalarını getirir
 */
async function getUserMachineAssignments(userId, workplaceId) {
    try {
        // İlk olarak tüm makineleri getir
        const machinesQuery = db.collection('workplaces').doc(workplaceId).collection('machines');
        const querySnapshot = await machinesQuery.get();

        const assignedMachines = [];

        querySnapshot.forEach((doc) => {
            const machineData = doc.data();
            // Kullanıcının atanmış olduğu makineleri filtrele
            if (machineData.assignedUserIds && machineData.assignedUserIds.includes(userId)) {
                assignedMachines.push({
                    id: doc.id,
                    ...machineData
                });
            }
        });

        return {
            success: true,
            machines: assignedMachines
        };
    } catch (error) {
        console.error('Get user machine assignments error:', error);
        return {
            success: false,
            error: 'Makine atamaları alınırken hata oluştu.'
        };
    }
}

/**
 * Kullanıcının rolüne göre yetki kontrolü yapar
 */
function checkPermission(userRole, requiredRole) {
    const roleHierarchy = {
        'admin': 2,
        'worker': 1
    };

    return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
}

/**
 * Kullanıcı profilini günceller
 */
async function updateUserProfile(userId, profileData) {
    try {
        const updateData = {
            ...profileData,
            updatedAt: new Date()
        };

        // Hassas alanları çıkar
        delete updateData.id;
        delete updateData.uid;
        delete updateData.createdAt;

        await db.collection('users').doc(userId).update(updateData);

        return {
            success: true,
            message: 'Profil güncellendi.'
        };
    } catch (error) {
        console.error('Update user profile error:', error);
        return {
            success: false,
            error: 'Profil güncellenirken hata oluştu.'
        };
    }
}
