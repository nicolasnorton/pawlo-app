/**
 * PAWLO™ Offline-First IndexedDB Storage Service
 * Aprovecha al 100% los recursos del dispositivo y navegador del usuario.
 * Garantiza persistencia local sin depender de llamadas continuas al servidor.
 */

const DB_NAME = 'pawlo_offline_vault_v1';
const DB_VERSION = 1;

export interface TriageCacheEntry {
  queryHash: string;
  query: string;
  petSpecies: string;
  petWeightKg: number;
  triageLevel: 'RED' | 'YELLOW' | 'GREEN' | 'BLUE';
  responseTitle: string;
  responseText: string;
  recommendedAction: string;
  pharmacologicalBlock: boolean;
  timestamp: number;
}

export interface AgentTelemetryStats {
  localQueriesCount: number;
  deepseekApiSavedCount: number;
  tokensSavedCount: number;
  bandwidthSavedBytes: number;
  lastUpdated: number;
}

class PawloIndexedDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB no soportado en este entorno'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store para caché de triaje clínico local (ahorra 100% de llamadas a DeepSeek para consultas repetidas/frecuentes)
        if (!db.objectStoreNames.contains('triage_cache')) {
          const store = db.createObjectStore('triage_cache', { keyPath: 'queryHash' });
          store.createIndex('by_species', 'petSpecies', { unique: false });
          store.createIndex('by_level', 'triageLevel', { unique: false });
        }

        // Store para telemetría de ahorro local (tokens y servidor)
        if (!db.objectStoreNames.contains('agent_telemetry')) {
          db.createObjectStore('agent_telemetry', { keyPath: 'id' });
        }

        // Store para carrito agéntico offline
        if (!db.objectStoreNames.contains('agent_cart')) {
          db.createObjectStore('agent_cart', { keyPath: 'productId' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.initPromise;
  }

  // Generador simple de hash para consultas clínicas
  generateHash(text: string, species: string): string {
    const clean = `${species.toLowerCase()}_${text.toLowerCase().trim().replace(/[^a-z0-9]/g, '')}`;
    let hash = 0;
    for (let i = 0; i < clean.length; i++) {
      const char = clean.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `hash_${Math.abs(hash).toString(36)}`;
  }

  async getCachedTriage(query: string, species: string): Promise<TriageCacheEntry | null> {
    try {
      const db = await this.getDB();
      const hash = this.generateHash(query, species);
      return new Promise((resolve) => {
        const tx = db.transaction('triage_cache', 'readonly');
        const store = tx.objectStore('triage_cache');
        const req = store.get(hash);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async saveCachedTriage(entry: TriageCacheEntry): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('triage_cache', 'readwrite');
        const store = tx.objectStore('triage_cache');
        store.put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // Ignorar fallback silencioso
    }
  }

  async getTelemetry(): Promise<AgentTelemetryStats> {
    const defaultStats: AgentTelemetryStats = {
      localQueriesCount: 0,
      deepseekApiSavedCount: 0,
      tokensSavedCount: 0,
      bandwidthSavedBytes: 0,
      lastUpdated: Date.now()
    };

    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('agent_telemetry', 'readonly');
        const store = tx.objectStore('agent_telemetry');
        const req = store.get('global_stats');
        req.onsuccess = () => {
          if (req.result) {
            resolve(req.result.data);
          } else {
            resolve(defaultStats);
          }
        };
        req.onerror = () => resolve(defaultStats);
      });
    } catch {
      return defaultStats;
    }
  }

  async recordSavings(tokens: number = 450, bytes: number = 3200): Promise<AgentTelemetryStats> {
    const current = await this.getTelemetry();
    const updated: AgentTelemetryStats = {
      localQueriesCount: current.localQueriesCount + 1,
      deepseekApiSavedCount: current.deepseekApiSavedCount + 1,
      tokensSavedCount: current.tokensSavedCount + tokens,
      bandwidthSavedBytes: current.bandwidthSavedBytes + bytes,
      lastUpdated: Date.now()
    };

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve) => {
        const tx = db.transaction('agent_telemetry', 'readwrite');
        const store = tx.objectStore('agent_telemetry');
        store.put({ id: 'global_stats', data: updated });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // Fallback
    }

    return updated;
  }
}

export const pawloDB = new PawloIndexedDB();
