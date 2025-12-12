const Redis = require('ioredis');

let redis;

// TEST MODE → use in-memory redis mock
if (process.env.NODE_ENV === 'test') {
  console.log('Using in-memory Redis mock for tests');

  // Full mock needed for e2e tests
  const store = new Map();

  redis = {
    get: async (key) => store.get(key) || null,
    set: async (key, value, mode, duration) => {
      store.set(key, value);
      if (mode === 'EX' && duration) {
        setTimeout(() => store.delete(key), duration * 1000);
      }
      return 'OK';
    },
    del: async (key) => store.delete(key),
    flushall: async () => store.clear(),
    quit: async () => true,
  };

} else if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);

  redis.on('connect', () => console.log('Redis Connected'));
  redis.on('error', (err) => console.error('Redis Error', err));

} else {
  console.warn('Redis disabled: no REDIS_URL provided');

  // Minimal fallback to keep app running, but not for tests
  const store = new Map();
  redis = {
    get: async (key) => store.get(key) || null,
    set: async (key, value) => store.set(key, value),
    del: async (key) => store.delete(key),
    flushall: async () => store.clear(),
    quit: async () => true,
  };
}

module.exports = redis;
