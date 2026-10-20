import { db, firebaseConfig } from './config.js';
import { getActiveBusinessId } from '../utils/session.js';
import { getActiveBusiness, getBusinessById } from '../utils/constants.js';
import { fromFirestoreDate, toFirestoreDate } from '../utils/date-helpers.js';
import { 
  collection, doc, getDoc, getDocs, setDoc, 
  deleteDoc, query, orderBy, where 
} from 'firebase/firestore';

const isLocalMode = firebaseConfig.apiKey === 'YOUR_API_KEY';

// Helper to get collection path for the active business
function getReadingsPath(businessId) {
  const bid = businessId || getActiveBusinessId() || 'estacion_12589';
  return `businesses/${bid}/readings`;
}

function getConfigPath(businessId) {
  const bid = businessId || getActiveBusinessId() || 'estacion_12589';
  return `businesses/${bid}/config`;
}

function getLocalReadings(businessId) {
  const bid = businessId || getActiveBusinessId() || 'estacion_12589';
  const data = localStorage.getItem(`${bid}_readings`);
  return data ? JSON.parse(data) : [];
}

function setLocalReadings(readings, businessId) {
  const bid = businessId || getActiveBusinessId() || 'estacion_12589';
  localStorage.setItem(`${bid}_readings`, JSON.stringify(readings));
}

function getLocalConfig(businessId) {
  const bid = businessId || getActiveBusinessId() || 'estacion_12589';
  const business = getBusinessById(bid);
  const data = localStorage.getItem(`${bid}_config_v2`);
  return data ? JSON.parse(data) : { pin: business.pin };
}

function setLocalConfig(config, businessId) {
  const bid = businessId || getActiveBusinessId() || 'estacion_12589';
  localStorage.setItem(`${bid}_config_v2`, JSON.stringify(config));
}

export async function saveReading(readingData) {
  try {
    const id = readingData.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
    const timestamp = toFirestoreDate(readingData.date || new Date());
    const dataToSave = { ...readingData, id, date: timestamp };

    if (isLocalMode) {
      const readings = getLocalReadings();
      readings.push(dataToSave);
      setLocalReadings(readings);
      return id;
    } else {
      const path = getReadingsPath();
      await setDoc(doc(db, path, id), dataToSave);
      return id;
    }
  } catch (error) {
    console.error('Error saving reading:', error);
    throw error;
  }
}

export async function getReadings(startDate, endDate) {
  try {
    if (isLocalMode) {
      let readings = getLocalReadings();
      if (startDate) {
        readings = readings.filter(r => new Date(r.date) >= new Date(startDate));
      }
      if (endDate) {
        readings = readings.filter(r => new Date(r.date) <= new Date(endDate));
      }
      readings.sort((a, b) => new Date(b.date) - new Date(a.date));
      return readings.map(r => ({ ...r, date: fromFirestoreDate(r.date) }));
    } else {
      const path = getReadingsPath();
      const qConstraints = [orderBy('date', 'desc')];
      if (startDate) qConstraints.push(where('date', '>=', toFirestoreDate(startDate)));
      if (endDate) qConstraints.push(where('date', '<=', toFirestoreDate(endDate)));
      
      const q = query(collection(db, path), ...qConstraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return { ...data, date: fromFirestoreDate(data.date) };
      });
    }
  } catch (error) {
    console.error('Error getting readings:', error);
    return [];
  }
}

export async function getLatestReading() {
  try {
    const readings = await getReadings();
    return readings.length > 0 ? readings[0] : null;
  } catch (error) {
    console.error('Error getting latest reading:', error);
    return null;
  }
}

export async function getLastTwoReadings() {
  try {
    const readings = await getReadings();
    return readings.slice(0, 2);
  } catch (error) {
    console.error('Error getting last two readings:', error);
    return [];
  }
}

export async function deleteReading(id) {
  try {
    if (isLocalMode) {
      const readings = getLocalReadings().filter(r => r.id !== id);
      setLocalReadings(readings);
    } else {
      const path = getReadingsPath();
      await deleteDoc(doc(db, path, id));
    }
  } catch (error) {
    console.error('Error deleting reading:', error);
    throw error;
  }
}

export async function getReadingsForPeriod(startDate, endDate) {
  return await getReadings(startDate, endDate);
}

export async function getPin() {
  try {
    const business = getActiveBusiness();
    if (isLocalMode) {
      const config = getLocalConfig();
      return config.pin || business.pin;
    } else {
      const path = getConfigPath();
      const docRef = doc(db, path, 'settings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().pin || business.pin;
      }
      return business.pin;
    }
  } catch (error) {
    console.error('Error getting PIN:', error);
    const business = getActiveBusiness();
    return business.pin;
  }
}

export async function setPin(newPin) {
  try {
    if (isLocalMode) {
      const config = getLocalConfig();
      config.pin = newPin;
      setLocalConfig(config);
    } else {
      const path = getConfigPath();
      await setDoc(doc(db, path, 'settings'), { pin: newPin }, { merge: true });
    }
  } catch (error) {
    console.error('Error setting PIN:', error);
    throw error;
  }
}

export async function getConfig() {
  try {
    const business = getActiveBusiness();
    if (isLocalMode) {
      return getLocalConfig();
    } else {
      const path = getConfigPath();
      const docRef = doc(db, path, 'settings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return { pin: business.pin };
    }
  } catch (error) {
    console.error('Error getting config:', error);
    const business = getActiveBusiness();
    return { pin: business.pin };
  }
}

export async function setConfig(config) {
  try {
    if (isLocalMode) {
      const currentConfig = getLocalConfig();
      setLocalConfig({ ...currentConfig, ...config });
    } else {
      const path = getConfigPath();
      await setDoc(doc(db, path, 'settings'), config, { merge: true });
    }
  } catch (error) {
    console.error('Error setting config:', error);
    throw error;
  }
}

export async function getServicesSchema() {
  const business = getActiveBusiness();
  const schema = {};
  business.services.forEach(service => {
    schema[service.name] = service.counters.map(c => c.short);
  });
  return schema;
}

// Migrate old root-level klin readings to the new namespaced path
export async function migrateLocalDataToFirebase() {
  if (isLocalMode) return;
  
  try {
    // Migrate old root 'readings' collection to businesses/klin/readings
    const oldQuery = query(collection(db, 'readings'), orderBy('date', 'desc'));
    const snapshot = await getDocs(oldQuery);
    
    if (snapshot.docs.length > 0) {
      console.log(`Migrating ${snapshot.docs.length} old readings to businesses/klin/readings...`);
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const id = data.id || docSnap.id;
        await setDoc(doc(db, 'businesses/klin/readings', id), data);
        await deleteDoc(doc(db, 'readings', docSnap.id));
      }
      console.log('Migration from root readings completed!');
    }

    // Also migrate old localStorage data
    const oldLocalReadings = localStorage.getItem('klin_readings');
    if (oldLocalReadings) {
      const readings = JSON.parse(oldLocalReadings);
      if (readings.length > 0) {
        console.log(`Migrating ${readings.length} old local readings...`);
        for (const reading of readings) {
          const id = reading.id || crypto.randomUUID();
          const timestamp = typeof reading.date === 'string' ? reading.date : toFirestoreDate(reading.date || new Date());
          const dataToSave = { ...reading, id, date: timestamp };
          await setDoc(doc(db, 'businesses/klin/readings', id), dataToSave);
        }
        localStorage.removeItem('klin_readings');
        console.log('Local migration completed!');
      }
    }

    // Migrate old config
    const oldConfigRef = doc(db, 'config', 'business');
    const oldConfigSnap = await getDoc(oldConfigRef);
    if (oldConfigSnap.exists()) {
      await setDoc(doc(db, 'businesses/klin/config', 'settings'), oldConfigSnap.data());
      await deleteDoc(oldConfigRef);
      console.log('Config migration completed!');
    }
  } catch (error) {
    console.error('Error during migration:', error);
  }
}
