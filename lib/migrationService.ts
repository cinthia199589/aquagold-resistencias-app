/**
 * SERVICIO DE MIGRACIÓN EN BACKGROUND
 * ===================================
 * 
 * Migra tests de Firebase legacy → Sistema híbrido
 * - No bloquea la interfaz
 * - Migra en batches pequeños
 * - Valida integridad de cada test
 * - Rollback automático si falla
 * 
 * Garantías:
 * ✅ Migración incremental (batch por batch)
 * ✅ Validación con checksums
 * ✅ Rollback automático
 * ✅ No interrumpe la app
 */

import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { ResistanceTest, ResistanceTestIndex } from './types';
import { 
  uploadTestToOneDrive, 
  downloadTestFromOneDrive 
} from './onedriveDataService';
import { generateChecksum } from './firestoreService';
import { 
  MIGRATION_CONFIG, 
  COLLECTIONS,
  log 
} from './migrationConfig';

export interface MigrationStatus {
  totalTests: number;
  migratedTests: number;
  pendingTests: number;
  errors: Array<{ testId: string; error: string }>;
  startedAt: Date;
  completedAt?: Date;
  isRunning: boolean;
  progress: number; // 0-100
}

/**
 * SERVICIO DE MIGRACIÓN
 */
export class MigrationService {
  private status: MigrationStatus = {
    totalTests: 0,
    migratedTests: 0,
    pendingTests: 0,
    errors: [],
    startedAt: new Date(),
    isRunning: false,
    progress: 0,
  };

  private abortMigration = false;

  /**
   * Obtener estado actual de migración
   */
  getStatus(): MigrationStatus {
    return { ...this.status };
  }

  /**
   * Iniciar migración automática en background
   */
  async startBackgroundMigration(
    instance: any,
    scopes: string[]
  ): Promise<void> {
    if (!MIGRATION_CONFIG.ENABLE_BACKGROUND_MIGRATION) {
      log.info('⏸️ Migración en background desactivada');
      return;
    }

    if (this.status.isRunning) {
      log.warn('⚠️ Migración ya está en progreso');
      return;
    }

    this.status.isRunning = true;
    this.status.startedAt = new Date();
    this.abortMigration = false;

    log.success('🚀 Iniciando migración en background...');

    try {
      // Validar que hay cuenta activa MSAL
      const accounts = instance.getAllAccounts();
      if (!accounts || accounts.length === 0) {
        log.error('❌ No hay cuenta activa en MSAL. La migración se detendrá.');
        this.status.isRunning = false;
        this.status.errors.push({
          testId: 'system',
          error: 'No hay cuenta activa en MSAL. Por favor inicia sesión primero.'
        });
        return;
      }
      
      // 1. Obtener tests que necesitan migración
      const pendingTests = await this.getPendingMigrationTests();

      this.status.totalTests = pendingTests.length;
      this.status.pendingTests = pendingTests.length;
      this.status.migratedTests = 0;
      this.status.progress = 0;

      log.info(`📊 Tests a migrar: ${pendingTests.length}`);

      if (pendingTests.length === 0) {
        log.success('✅ Todos los tests ya están migrados');
        this.status.isRunning = false;
        this.status.progress = 100;
        return;
      }

      // 2. Migrar en batches
      const batchSize = MIGRATION_CONFIG.MIGRATION_BATCH_SIZE;

      for (let i = 0; i < pendingTests.length; i += batchSize) {
        // Verificar si se abortó la migración
        if (this.abortMigration) {
          log.warn('⏹️ Migración abortada por el usuario');
          break;
        }

        const batch = pendingTests.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(pendingTests.length / batchSize);

        log.info(`📦 Migrando batch ${batchNumber}/${totalBatches} (${batch.length} tests)`);

        await this.migrateBatch(instance, scopes, batch);

        // Actualizar progreso
        this.status.progress = Math.round((this.status.migratedTests / this.status.totalTests) * 100);

        // Esperar antes del siguiente batch (no saturar)
        if (i + batchSize < pendingTests.length) {
          await this.delay(MIGRATION_CONFIG.MIGRATION_DELAY_MS);
        }

        // Verificar si hay demasiados errores
        if (this.status.errors.length > MIGRATION_CONFIG.MAX_MIGRATION_ERRORS) {
          log.error('❌ Demasiados errores, deteniendo migración');
          if (MIGRATION_CONFIG.AUTO_ROLLBACK_ON_ERROR) {
            await this.rollback();
          }
          break;
        }
      }

      this.status.completedAt = new Date();
      this.status.progress = 100;
      log.success('✅ Migración completada');
      this.printStatus();

    } catch (error) {
      log.error('❌ Error en migración:', error);
      if (MIGRATION_CONFIG.AUTO_ROLLBACK_ON_ERROR) {
        await this.rollback();
      }
    } finally {
      this.status.isRunning = false;
    }
  }

  /**
   * Pausar/Abortar migración en progreso
   */
  abortCurrentMigration(): void {
    if (this.status.isRunning) {
      log.warn('⏹️ Abortando migración...');
      this.abortMigration = true;
    }
  }

  /**
   * 🚀 NUEVO: Iniciar migración MANUAL (ignora flag ENABLE_BACKGROUND_MIGRATION)
   * Usa esta función cuando el usuario hace click en el botón de migración
   */
  async startManualMigration(
    instance: any,
    scopes: string[]
  ): Promise<void> {
    if (this.status.isRunning) {
      log.warn('⚠️ Migración ya está en progreso');
      return;
    }

    this.status.isRunning = true;
    this.status.startedAt = new Date();
    this.abortMigration = false;

    log.success('🚀 Iniciando migración MANUAL...');

    try {
      // Validar que hay cuenta activa MSAL
      const accounts = instance.getAllAccounts();
      if (!accounts || accounts.length === 0) {
        log.error('❌ No hay cuenta activa en MSAL');
        this.status.isRunning = false;
        this.status.errors.push({
          testId: 'system',
          error: 'No hay cuenta activa en MSAL'
        });
        throw new Error('No hay cuenta activa en MSAL');
      }
      
      // Obtener tests pendientes de migración
      const pendingTests = await this.getPendingMigrationTests();

      this.status.totalTests = pendingTests.length;
      this.status.pendingTests = pendingTests.length;
      this.status.migratedTests = 0;
      this.status.progress = 0;

      log.info(`📊 Tests a migrar: ${pendingTests.length}`);

      if (pendingTests.length === 0) {
        log.success('✅ Todos los tests ya están migrados');
        this.status.isRunning = false;
        this.status.progress = 100;
        return;
      }

      // Migrar en batches
      const batchSize = MIGRATION_CONFIG.MIGRATION_BATCH_SIZE;

      for (let i = 0; i < pendingTests.length; i += batchSize) {
        if (this.abortMigration) {
          log.warn('⏹️ Migración abortada');
          break;
        }

        const batch = pendingTests.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(pendingTests.length / batchSize);

        log.info(`📦 Batch ${batchNumber}/${totalBatches} (${batch.length} tests)`);

        await this.migrateBatch(instance, scopes, batch);

        this.status.progress = Math.round(
          (this.status.migratedTests / this.status.totalTests) * 100
        );

        // Verificar errores
        if (this.status.errors.length > MIGRATION_CONFIG.MAX_MIGRATION_ERRORS) {
          log.error('❌ Demasiados errores, deteniendo migración');
          this.status.isRunning = false;
          throw new Error(`Migración abortada: ${this.status.errors.length} errores`);
        }

        // Delay entre batches
        if (i + batchSize < pendingTests.length) {
          await this.delay(MIGRATION_CONFIG.MIGRATION_DELAY_MS);
        }
      }

      this.status.completedAt = new Date();
      this.status.progress = 100;
      log.success('✅ Migración manual completada');
      this.printStatus();

    } catch (error) {
      log.error('❌ Error en migración manual:', error);
      throw error;
    } finally {
      this.status.isRunning = false;
    }
  }

  /**
   * Obtener tests que NO han sido migrados
   */
  private async getPendingMigrationTests(): Promise<ResistanceTest[]> {
    // 1. Obtener todos los IDs del índice (ya migrados)
    const indexRef = collection(db, COLLECTIONS.INDEX);
    const indexSnapshot = await getDocs(indexRef);
    const migratedIds = new Set(indexSnapshot.docs.map(d => d.id));

    log.info(`📊 Tests ya migrados: ${migratedIds.size}`);

    // 2. Obtener todos los tests del sistema legacy
    const legacyRef = collection(db, COLLECTIONS.LEGACY);
    const legacySnapshot = await getDocs(legacyRef);

    log.info(`📊 Tests en legacy: ${legacySnapshot.size}`);

    // 3. Filtrar solo los NO migrados
    const pendingTests = legacySnapshot.docs
      .filter(doc => !migratedIds.has(doc.id))
      .map(doc => ({ id: doc.id, ...doc.data() } as ResistanceTest));

    return pendingTests;
  }

  /**
   * Migrar un batch de tests
   */
  private async migrateBatch(
    instance: any,
    scopes: string[],
    tests: ResistanceTest[]
  ): Promise<void> {
    const results = await Promise.allSettled(
      tests.map(test => this.migrateTestWithRetry(instance, scopes, test))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.status.migratedTests++;
        this.status.pendingTests--;
      } else {
        this.status.errors.push({
          testId: tests[index].id,
          error: result.reason?.message || 'Error desconocido',
        });
        log.error(`❌ Error migrando test ${tests[index].id}:`, result.reason);
      }
    });

    log.info(`✅ Batch completado: ${this.status.migratedTests}/${this.status.totalTests} tests migrados`);
  }

  /**
   * Migrar un test individual con reintentos
   */
  private async migrateTestWithRetry(
    instance: any,
    scopes: string[],
    test: ResistanceTest,
    retryCount = 0
  ): Promise<void> {
    try {
      await this.migrateTest(instance, scopes, test);
    } catch (error) {
      if (retryCount < MIGRATION_CONFIG.MAX_RETRIES) {
        log.warn(`⚠️ Reintentando migración de test ${test.id} (intento ${retryCount + 1}/${MIGRATION_CONFIG.MAX_RETRIES})`);
        await this.delay(MIGRATION_CONFIG.RETRY_DELAY_MS);
        return this.migrateTestWithRetry(instance, scopes, test, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Migrar un test individual con validación
   */
  private async migrateTest(
    instance: any,
    scopes: string[],
    test: ResistanceTest
  ): Promise<void> {
    log.info(`  ⚙️ Migrando test ${test.id} (${test.lotNumber})...`);

    try {
      // 1. Subir a OneDrive
      const oneDrivePath = await uploadTestToOneDrive(instance, scopes, test);

      // 2. Generar checksum para validación
      const checksum = generateChecksum(test);

      // 3. Crear índice en Firebase
      const indexRef = doc(db, COLLECTIONS.INDEX, test.id);
      await setDoc(indexRef, {
        id: test.id,
        lotNumber: test.lotNumber,
        date: test.date,
        isCompleted: test.isCompleted,
        updatedAt: test.updatedAt || Timestamp.now(),
        oneDrivePath,
        migratedAt: Timestamp.now(),
        legacyChecksum: checksum,
      } as ResistanceTestIndex);

      // 4. VALIDAR: Descargar y comparar checksum (si está activado)
      if (MIGRATION_CONFIG.VALIDATE_DATA_INTEGRITY) {
        const downloaded = await downloadTestFromOneDrive(
          instance,
          scopes,
          test.testType,
          test.id,
          test.date
        );
        const downloadedChecksum = generateChecksum(downloaded);

        if (checksum !== downloadedChecksum) {
          throw new Error(
            `Checksum mismatch: ${checksum} vs ${downloadedChecksum}`
          );
        }
      }

      log.success(`  ✅ Test ${test.id} migrado y validado`);

    } catch (error) {
      log.error(`  ❌ Error migrando test ${test.id}:`, error);
      throw error;
    }
  }

  /**
   * Rollback: Eliminar índices creados, mantener legacy intacto
   */
  private async rollback(): Promise<void> {
    log.warn('🔄 Ejecutando rollback...');

    try {
      // Eliminar todos los índices creados en esta sesión
      const indexRef = collection(db, COLLECTIONS.INDEX);
      const indexSnapshot = await getDocs(indexRef);

      let deletedCount = 0;

      for (const indexDoc of indexSnapshot.docs) {
        const indexData = indexDoc.data() as ResistanceTestIndex;

        // Solo eliminar índices creados en esta migración
        if (indexData.migratedAt) {
          const migratedDate = indexData.migratedAt.toDate();
          const migrationStartDate = this.status.startedAt;

          if (migratedDate >= migrationStartDate) {
            await deleteDoc(indexDoc.ref);
            deletedCount++;
          }
        }
      }

      log.success(`✅ Rollback completado - ${deletedCount} índices eliminados`);
      log.info('Sistema legacy restaurado completamente');

    } catch (error) {
      log.error('❌ Error en rollback:', error);
    }
  }

  /**
   * Imprimir resumen de migración
   */
  private printStatus(): void {
    console.log('\n📊 ========== RESUMEN DE MIGRACIÓN ==========');
    console.log(`   Total tests: ${this.status.totalTests}`);
    console.log(`   ✅ Migrados: ${this.status.migratedTests}`);
    console.log(`   ⏳ Pendientes: ${this.status.pendingTests}`);
    console.log(`   ❌ Errores: ${this.status.errors.length}`);
    console.log(`   📈 Progreso: ${this.status.progress}%`);

    if (this.status.errors.length > 0) {
      console.log('\n   ❌ Errores encontrados:');
      this.status.errors.forEach((err, index) => {
        console.log(`     ${index + 1}. ${err.testId}: ${err.error}`);
      });
    }

    const duration = this.status.completedAt
      ? (this.status.completedAt.getTime() - this.status.startedAt.getTime()) / 1000
      : 0;
    console.log(`\n   ⏱️ Duración: ${duration.toFixed(1)}s`);
    console.log('==========================================\n');
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reiniciar estado (para testing)
   */
  resetStatus(): void {
    this.status = {
      totalTests: 0,
      migratedTests: 0,
      pendingTests: 0,
      errors: [],
      startedAt: new Date(),
      isRunning: false,
      progress: 0,
    };
    this.abortMigration = false;
  }
}

// Exportar instancia única (singleton)
export const migrationService = new MigrationService();
