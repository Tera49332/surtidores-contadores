// This file redirects to the proper db module
export { 
  saveReading, getReadings, getLastTwoReadings, deleteReading, 
  getPin, setPin, getConfig, setConfig, getReadingsForPeriod, 
  getLatestReading, getServicesSchema, migrateLocalDataToFirebase,
  saveGasReading, getGasReadings, getLatestGasReading, deleteGasReading
} from './firebase/db.js';
