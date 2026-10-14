/**
 * JSON requests built for flaky mobile networks: they time out, and transient
 * failures are retried with backoff.
 */

const REQUEST_TIMEOUT_MS = 10_000;
const RETRY_DELAYS_MS = [1_000, 3_000];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchJson = async (url: string): Promise<unknown> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) {
      // No point burning retries while the device knows it is offline — the
      // caller retries on the `online` event instead
      if (!navigator.onLine) break;
      await wait(RETRY_DELAYS_MS[attempt - 1]);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
};

/**
 * Memoises a load in a module-level cache. It holds promises so concurrent
 * callers share one request; failures are evicted so the next attempt
 * refetches.
 */
export const cached = <K, V>(cache: Map<K, Promise<V>>, key: K, load: () => Promise<V>) => {
  const existing = cache.get(key);
  if (existing) return existing;

  const promise = load();
  cache.set(key, promise);
  promise.catch(() => cache.delete(key));
  return promise;
};
