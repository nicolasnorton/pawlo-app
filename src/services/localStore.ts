/**
 * PAWLO™ — Local-First State Persistence & Event Broadcasting Service
 *
 * Proporciona almacenamiento reactivo y persistente mediante localStorage
 * y difusión de eventos personalizados (CustomEvent) para que todas las
 * mutaciones realizadas por el usuario o por el Asistente PAWLO IA
 * sobrevivan recargas de página y se sincronicen en tiempo real.
 */

import { useState, useEffect, useCallback } from 'react';

const PAWLO_STORAGE_EVENT = 'pawlo_local_state_change';

export interface PawloStorageChangeEvent<T = unknown> {
  key: string;
  value: T;
  timestamp: number;
}

/**
 * Carga un estado tipado desde localStorage con valor de respaldo seguro.
 */
export function loadLocalState<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[PAWLO localStore] Error al parsear clave "${key}":`, err);
    return fallback;
  }
}

/**
 * Guarda un estado tipado en localStorage y transmite el evento a la ventana actual.
 */
export function saveLocalState<T>(key: string, value: T): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);

    // Difundir evento local para reactividad cruzada de componentes
    const eventDetail: PawloStorageChangeEvent<T> = {
      key,
      value,
      timestamp: Date.now()
    };
    window.dispatchEvent(new CustomEvent(PAWLO_STORAGE_EVENT, { detail: eventDetail }));
  } catch (err) {
    console.error(`[PAWLO localStore] Error al guardar clave "${key}":`, err);
  }
}

/**
 * Elimina una clave de localStorage y notifica.
 */
export function removeLocalState(key: string): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(key);
    window.dispatchEvent(
      new CustomEvent(PAWLO_STORAGE_EVENT, {
        detail: { key, value: null, timestamp: Date.now() }
      })
    );
  } catch (err) {
    console.error(`[PAWLO localStore] Error al eliminar clave "${key}":`, err);
  }
}

/**
 * Suscribe un callback a cambios de una clave específica.
 */
export function subscribeLocalState<T>(
  key: string,
  callback: (newValue: T) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event: Event) => {
    const custom = event as CustomEvent<PawloStorageChangeEvent<T>>;
    if (custom.detail && custom.detail.key === key) {
      callback(custom.detail.value);
    }
  };

  window.addEventListener(PAWLO_STORAGE_EVENT, handler);
  return () => {
    window.removeEventListener(PAWLO_STORAGE_EVENT, handler);
  };
}

/**
 * Hook de React para estado local reactivo sincronizado con localStorage.
 */
export function useLocalState<T>(
  key: string,
  fallback: T
): [T, (valOrUpdater: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => loadLocalState<T>(key, fallback));

  useEffect(() => {
    return subscribeLocalState<T>(key, (updated) => {
      setState(updated);
    });
  }, [key]);

  const setLocal = useCallback(
    (valOrUpdater: T | ((prev: T) => T)) => {
      setState(prev => {
        const next = typeof valOrUpdater === 'function'
          ? (valOrUpdater as (prev: T) => T)(prev)
          : valOrUpdater;
        saveLocalState(key, next);
        return next;
      });
    },
    [key]
  );

  return [state, setLocal];
}
