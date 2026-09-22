/**
 * Runtime artwork from The Met's Open Access collection (Islamic Art, dept 14).
 *
 * Chosen because it is the only keyless collection API that sends
 * `Access-Control-Allow-Origin: *`, so it works from the browser with no proxy.
 * Its images are public domain (CC0) and need no attribution, though we show a
 * credit line anyway.
 *
 * Three things drive the design here:
 *
 * 1. The API sits behind bot protection. The documented 80 req/s is not what is
 *    enforced — bursts of ~30 sequential requests get an HTML challenge page
 *    instead of JSON. So requests are paced, lazy (one per surah, on demand)
 *    and cached in localStorage more or less forever.
 * 2. Nothing in the API filters for subject matter. `departmentId=14` is about
 *    provenance, so it happily returns figurative miniatures and jewellery.
 *    Every object is validated against `isAcceptable` before it is shown.
 * 3. Anything that fails — offline, blocked, rejected by the filter — falls
 *    back to the bundled artwork. The UI never shows a broken image.
 */

const MET_BASE = "https://collectionapi.metmuseum.org/public/collection";

/**
 * `v1/search` retires 2026-10-01, so this uses v1.1. v1.1 is also far stricter:
 * this query returns 89 tightly-matched folios where v1 returned 491 loose
 * matches including jewellery and ceramics.
 */
const SEARCH_URL =
  `${MET_BASE}/v1.1/search?departmentId=14&hasImages=true&limit=100` +
  `&q=${encodeURIComponent("Qur'an folio")}`;

const objectUrl = (id: number) => `${MET_BASE}/v1/objects/${id}`;

const IDS_KEY = "quranPlayer.artwork.ids";
const OBJECTS_KEY = "quranPlayer.artwork.objects";
const IDS_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Minimum gap between requests, to stay well clear of the bot protection. */
const MIN_REQUEST_INTERVAL = 400;

/** Consecutive failures after which we stop calling the API for this session. */
const FAILURE_LIMIT = 2;

export interface Artwork {
  objectId: number;
  imageUrl: string;
  title: string;
  date: string;
}

// ---------------------------------------------------------------------------
// Content filter
// ---------------------------------------------------------------------------

const ALLOWED_CLASSIFICATION = /codices|calligraphy|manuscript/i;

/** The subject must be explicit, not merely Islamic-world in provenance. */
const REQUIRED_SUBJECT = /qur'?an|kor'?an|calligraph|illuminat/i;

/**
 * Figurative imagery: Shahnama and Khamsa miniatures sit in the same
 * department and share the "Codices" classification, so they have to be
 * excluded by subject.
 */
const FIGURATIVE =
  /portrait|prince|king|queen|hunt|battle|horse|lion|figure|shahnama|khamsa|bahram|majnun|layla|dragon|bird|beast|youth|lady|woman|man\b|feline|camel|elephant|rider|court|dancer|musician|angel|demon|div\b/i;

interface MetObject {
  objectID?: number;
  title?: string;
  objectDate?: string;
  classification?: string;
  isPublicDomain?: boolean;
  primaryImageSmall?: string;
}

const isAcceptable = (object: MetObject): boolean => {
  const title = object.title ?? "";
  return Boolean(
    object.isPublicDomain &&
      object.primaryImageSmall &&
      ALLOWED_CLASSIFICATION.test(object.classification ?? "") &&
      REQUIRED_SUBJECT.test(title) &&
      !FIGURATIVE.test(title)
  );
};

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const readStore = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const writeStore = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or quota exceeded — caching is an optimisation, not a need
  }
};

// ---------------------------------------------------------------------------
// Paced, fault-tolerant fetching
// ---------------------------------------------------------------------------

let lastRequestAt = 0;
let queue: Promise<unknown> = Promise.resolve();
let consecutiveFailures = 0;

/** Serialises requests and spaces them out, whatever the call pattern. */
const paced = <T,>(task: () => Promise<T>): Promise<T> => {
  const run = async () => {
    const wait = MIN_REQUEST_INTERVAL - (Date.now() - lastRequestAt);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastRequestAt = Date.now();
    return task();
  };

  const result = queue.then(run, run);
  queue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
};

/**
 * The bot protection answers with an HTML challenge page and a 200 status, so
 * a plain `response.json()` would throw a confusing parse error. Detect it.
 */
const fetchJson = async (url: string): Promise<unknown> => {
  const response = await fetch(url);
  const text = await response.text();

  if (!response.ok || !text.trimStart().startsWith("{")) {
    throw new Error(`Met API unavailable (${response.status})`);
  }

  return JSON.parse(text);
};

const request = async (url: string): Promise<unknown | null> => {
  if (consecutiveFailures >= FAILURE_LIMIT) return null;

  try {
    const data = await paced(() => fetchJson(url));
    consecutiveFailures = 0;
    return data;
  } catch {
    consecutiveFailures += 1;
    return null;
  }
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

let idsPromise: Promise<number[]> | null = null;

/** The candidate object IDs — one search call, then cached for 30 days. */
const getObjectIds = (): Promise<number[]> => {
  if (idsPromise) return idsPromise;

  idsPromise = (async () => {
    const cached = readStore<{ ids: number[]; fetchedAt: number }>(IDS_KEY);
    if (cached?.ids?.length && Date.now() - cached.fetchedAt < IDS_TTL) {
      return cached.ids;
    }

    const data = (await request(SEARCH_URL)) as { objectIDs?: number[] } | null;
    const ids = data?.objectIDs ?? [];
    if (ids.length) writeStore(IDS_KEY, { ids, fetchedAt: Date.now() });

    // Fall back to a stale cache rather than nothing
    return ids.length ? ids : cached?.ids ?? [];
  })();

  return idsPromise;
};

/** `null` is cached too: it means "checked, rejected" — never re-fetch it. */
type ObjectCache = Record<string, Artwork | null>;

const inFlight = new Map<number, Promise<Artwork | null>>();

const getArtworkByObjectId = (id: number): Promise<Artwork | null> => {
  const cache = readStore<ObjectCache>(OBJECTS_KEY) ?? {};
  if (id in cache) return Promise.resolve(cache[id]);

  const existing = inFlight.get(id);
  if (existing) return existing;

  const pending = (async () => {
    const object = (await request(objectUrl(id))) as MetObject | null;

    // A network failure is not a verdict — leave it uncached so it can retry
    if (!object) return null;

    const artwork: Artwork | null = isAcceptable(object)
      ? {
          objectId: id,
          imageUrl: object.primaryImageSmall as string,
          title: object.title ?? "Qur'an folio",
          date: object.objectDate ?? "",
        }
      : null;

    const next = readStore<ObjectCache>(OBJECTS_KEY) ?? {};
    next[id] = artwork;
    writeStore(OBJECTS_KEY, next);

    inFlight.delete(id);
    return artwork;
  })();

  inFlight.set(id, pending);
  return pending;
};

/**
 * Deterministic: a given surah always resolves to the same artwork, so covers
 * do not shuffle between renders or sessions.
 */
export const getArtworkForSurah = async (
  surahNumber: number
): Promise<Artwork | null> => {
  const ids = await getObjectIds();
  if (!ids.length) return null;

  const id = ids[(Math.max(1, surahNumber) - 1) % ids.length];
  return getArtworkByObjectId(id);
};
