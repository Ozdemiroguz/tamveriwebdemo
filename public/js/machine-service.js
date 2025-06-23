// Machine Service - CDN Version
// Makine yönetimi servisleri

// Get all machines for a workplace
async function getMachines(workplaceId) {
    try {
        console.log('Getting machines for workplace:', workplaceId);

        if (!workplaceId) {
            throw new Error('Workplace ID is required');
        }

        const machinesSnapshot = await window.db
            .collection('workplaces')
            .doc(workplaceId)
            .collection('machines')
            .orderBy('createdAt', 'desc')
            .get();

        const machines = [];
        machinesSnapshot.forEach(doc => {
            machines.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log('Machines loaded:', machines.length);
        return machines;
    } catch (error) {
        console.error('Error getting machines:', error);
        throw error;
    }
}

// Get machines assigned to a specific user
async function getUserAssignedMachines(workplaceId, userId) {
    try {
        console.log('Getting assigned machines for user:', userId, 'in workplace:', workplaceId);

        if (!workplaceId || !userId) {
            throw new Error('Workplace ID and User ID are required');
        }

        const machinesSnapshot = await window.db
            .collection('workplaces')
            .doc(workplaceId)
            .collection('machines')
            .where('assignedUserIds', 'array-contains', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const machines = [];
        machinesSnapshot.forEach(doc => {
            machines.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log('Assigned machines loaded:', machines.length);
        return machines;
    } catch (error) {
        console.error('Error getting assigned machines:', error);
        throw error;
    }
}

// Get machine details by ID
async function getMachineDetails(workplaceId, machineId) {
    try {
        console.log('Getting machine details:', machineId);

        if (!workplaceId || !machineId) {
            throw new Error('Workplace ID and Machine ID are required');
        }

        const machineDoc = await window.db
            .collection('workplaces')
            .doc(workplaceId)
            .collection('machines')
            .doc(machineId)
            .get();

        if (!machineDoc.exists) {
            throw new Error('Machine not found');
        }

        const machine = {
            id: machineDoc.id,
            ...machineDoc.data()
        };

        console.log('Machine details loaded:', machine.name);
        return machine;
    } catch (error) {
        console.error('Error getting machine details:', error);
        throw error;
    }
}

// Filter machines by status
function filterMachinesByStatus(machines, status) {
    try {
        if (!status || status === 'all') {
            return machines;
        }

        const filtered = machines.filter(machine => machine.status === status);
        console.log(`Filtered machines by status '${status}':`, filtered.length);
        return filtered;
    } catch (error) {
        console.error('Error filtering machines by status:', error);
        return machines;
    }
}

// Get machine statistics
function getMachineStatistics(machines) {
    try {
        const stats = {
            total: machines.length,
            active: 0,
            error: 0,
            maintenance: 0,
            stopped: 0
        };

        machines.forEach(machine => {
            switch (machine.status) {
                case 'active':
                    stats.active++;
                    break;
                case 'error':
                    stats.error++;
                    break;
                case 'maintenance':
                    stats.maintenance++;
                    break;
                case 'stopped':
                    stats.stopped++;
                    break;
            }
        });

        console.log('Machine statistics calculated:', stats);
        return stats;
    } catch (error) {
        console.error('Error calculating machine statistics:', error);
        return {
            total: 0,
            active: 0,
            error: 0,
            maintenance: 0,
            stopped: 0
        };
    }
}

// Update machine status
async function updateMachineStatus(workplaceId, machineId, status) {
    try {
        console.log('Updating machine status:', machineId, 'to', status);

        if (!workplaceId || !machineId || !status) {
            throw new Error('Workplace ID, Machine ID and Status are required');
        }

        await window.db
            .collection('workplaces')
            .doc(workplaceId)
            .collection('machines')
            .doc(machineId)
            .update({
                status: status,
                updatedAt: new Date()
            });

        console.log('Machine status updated successfully');
        return true;
    } catch (error) {
        console.error('Error updating machine status:', error);
        throw error;
    }
}

// Add new machine
async function addMachine(workplaceId, machineData) {
    try {
        console.log('Adding new machine:', machineData.name);

        if (!workplaceId || !machineData) {
            throw new Error('Workplace ID and Machine Data are required');
        }

        const newMachine = {
            ...machineData,
            assignedUserIds: machineData.assignedUserIds || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await window.db
            .collection('workplaces')
            .doc(workplaceId)
            .collection('machines')
            .add(newMachine);

        console.log('Machine added successfully with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding machine:', error);
        throw error;
    }
}

// Listen for real-time machine updates
function listenToMachineUpdates(workplaceId, callback) {
    try {
        console.log('Setting up real-time machine listener for workplace:', workplaceId);

        if (!workplaceId || !callback) {
            throw new Error('Workplace ID and Callback are required');
        }

        const unsubscribe = window.db
            .collection('workplaces')
            .doc(workplaceId)
            .collection('machines')
            .orderBy('createdAt', 'desc')
            .onSnapshot(
                (snapshot) => {
                    console.log('Real-time machine update received');
                    const machines = [];
                    snapshot.forEach(doc => {
                        machines.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    callback(machines);
                },
                (error) => {
                    console.error('Real-time machine listener error:', error);
                }
            );

        console.log('Real-time machine listener set up successfully');
        return unsubscribe;
    } catch (error) {
        console.error('Error setting up machine listener:', error);
        return null;
    }
}

// Assign user to machine
async function assignUserToMachine(workplaceId, machineId, userId) {
    try {
        console.log('Assigning user', userId, 'to machine', machineId);

        if (!workplaceId || !machineId || !userId) {
            throw new Error('Workplace ID, Machine ID and User ID are required');
        }

        const machineRef = window.db
            .collection('workplaces')
            .doc(workplaceId)
            .collection('machines')
            .doc(machineId);

        await window.db.runTransaction(async (transaction) => {
            const machineDoc = await transaction.get(machineRef);

            if (!machineDoc.exists) {
                throw new Error('Machine not found');
            }

            const currentAssignedUsers = machineDoc.data().assignedUserIds || [];

            if (!currentAssignedUsers.includes(userId)) {
                currentAssignedUsers.push(userId);
                transaction.update(machineRef, {
                    assignedUserIds: currentAssignedUsers,
                    updatedAt: new Date()
                });
            }
        });

        console.log('User assigned to machine successfully');
        return true;
    } catch (error) {
        console.error('Error assigning user to machine:', error);
        throw error;
    }
}

// Remove user from machine
async function removeUserFromMachine(workplaceId, machineId, userId) {
    try {
        console.log('Removing user', userId, 'from machine', machineId);

        if (!workplaceId || !machineId || !userId) {
            throw new Error('Workplace ID, Machine ID and User ID are required');
        }

        const machineRef = window.db
            .collection('workplaces')
            .doc(workplaceId)
            .collection('machines')
            .doc(machineId);

        await window.db.runTransaction(async (transaction) => {
            const machineDoc = await transaction.get(machineRef);

            if (!machineDoc.exists) {
                throw new Error('Machine not found');
            }

            const currentAssignedUsers = machineDoc.data().assignedUserIds || [];
            const updatedAssignedUsers = currentAssignedUsers.filter(id => id !== userId);

            transaction.update(machineRef, {
                assignedUserIds: updatedAssignedUsers,
                updatedAt: new Date()
            });
        });

        console.log('User removed from machine successfully');
        return true;
    } catch (error) {
        console.error('Error removing user from machine:', error);
        throw error;
    }
}

// Global functions for CDN usage
window.getMachines = getMachines;
window.getUserAssignedMachines = getUserAssignedMachines;
window.getMachineDetails = getMachineDetails;
window.filterMachinesByStatus = filterMachinesByStatus;
window.getMachineStatistics = getMachineStatistics;
window.updateMachineStatus = updateMachineStatus;
window.addMachine = addMachine;
window.listenToMachineUpdates = listenToMachineUpdates;
window.assignUserToMachine = assignUserToMachine;
window.removeUserFromMachine = removeUserFromMachine;

console.log('Machine service loaded successfully');
