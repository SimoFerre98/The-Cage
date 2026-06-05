interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minuti in millisecondi

/**
 * Utility per il caching con pattern Stale-While-Revalidate (SWR).
 * Restituisce i dati dalla cache se presenti, in modo istantaneo.
 * Se la cache è scaduta, effettua una reidratazione in background 
 * ed esegue il callback onRevalidate per aggiornare l'UI in React.
 */
export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  onRevalidate?: (newData: T) => void,
  ttlMs: number = DEFAULT_TTL
): Promise<T> {
  // Esegui normalmente senza cache lato server
  if (typeof window === 'undefined') {
    return fetchFn();
  }

  // Inizializza l'oggetto globale associato a window per resistere ad Astro View Transitions
  const win = window as any;
  if (!win.__cage_cache) {
    win.__cage_cache = {};
  }
  const memCache = win.__cage_cache as Record<string, CacheItem<T>>;
  const now = Date.now();

  let cachedItem = memCache[key];

  // Se non c'è in memoria, tenta con il localStorage
  if (!cachedItem) {
    try {
      const lsStr = localStorage.getItem(key);
      if (lsStr) {
        cachedItem = JSON.parse(lsStr) as CacheItem<T>;
        memCache[key] = cachedItem; // Rigenera la cache in memory
      }
    } catch (e) {
      console.warn('Errore lettura localStorage per cache:', key);
    }
  }

  // Helper per scrivere il dato nella cache e su disco
  const saveToCache = (data: T) => {
    const item: CacheItem<T> = { data, timestamp: Date.now() };
    memCache[key] = item;
    try {
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.warn('Errore scrittura localStorage per cache:', key);
    }
    return data;
  };

  // Processo di fetch effettivo dal DB
  const doFetch = async () => {
    try {
      const freshData = await fetchFn();
      
      // Controllo sommario per evitare di scatenare re-render inutili se i dati non sono mutati
      const isDifferent = JSON.stringify(freshData) !== JSON.stringify(cachedItem?.data);
      
      saveToCache(freshData);
      
      if (isDifferent && onRevalidate) {
        onRevalidate(freshData);
      }
      return freshData;
    } catch (e) {
      console.error('Errore durante il fetch per la chiave di cache', key, e);
      throw e; // Non sovrascriviamo la cache in caso di errore
    }
  };

  // Logica SWR
  if (cachedItem) {
    // Esegui sempre il fetch in background in modo asincrono per reidratare con i dati più freschi
    // (Pattern Stale-While-Revalidate classico)
    doFetch().catch(() => {});
    
    // Ritorna subito il dato in cache per caricamento istantaneo
    return cachedItem.data;
  }

  // Cache Miss assoluto: esegui bloccante
  return doFetch();
}
