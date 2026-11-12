// This file redirects to the proper db module
export { 
  saveReading, updateReadingData, getReadings, getLastTwoReadings, deleteReading, 
  getPin, setPin, getConfig, setConfig, getReadingsForPeriod, 
  getLatestReading, getServicesSchema, migrateLocalDataToFirebase,
  saveGasReading, getGasReadings, getLatestGasReading, deleteGasReading,
  saveGasDelivery, getGasDeliveries, deleteGasDelivery,
  saveLavaderoReading, getLavaderoReadings, getLatestLavaderoReading
} from './firebase/db.js';
