export * from './db';
export * from './fileStorage';
export * from './chatStorage';
export * from './settingsStorage';
export * from './secureStorage';

import * as db from './db';

export const migrateToIndexedDB = async (): Promise<void> => {
  console.log('Starting migration to IndexedDB...');
  try {
    await db.initDatabase();
    
    await db.migrateFromLocalStorage();
    
    await db.setValue(db.STORES.SETTINGS, 'migration-complete', true);
    
    console.log('Migration to IndexedDB completed successfully!');
    return Promise.resolve();
  } catch (error) {
    console.error('Migration to IndexedDB failed:', error);
    return Promise.reject(error);
  }
};

export const isMigrationComplete = async (): Promise<boolean> => {
  try {
    const migrationComplete = await db.getValue<boolean>(db.STORES.SETTINGS, 'migration-complete');
    return migrationComplete === true;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
};
