/**
 * A simplified interface for LocalStorage operations.
 */
export type LocalStorageInterface = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const hasOwn = Object.prototype.hasOwnProperty;

const createInMemoryStorage = (): LocalStorageInterface => {
  const storage: Record<string, string> = Object.create(null);
  return {
    setItem(key: string, val: string): void {
      storage[key] = val;
    },
    removeItem(key: string): void {
      delete storage[key];
    },
    getItem(key: string): string | null {
      return hasOwn.call(storage, key) ? storage[key] : null;
    }
  };
};

let storageImplementation: LocalStorageInterface | undefined;

try {
  const testKey = `_storage_test_${Math.random().toString(36).substring(7)}`;
  const nativeStorage = globalThis.localStorage;

  if (nativeStorage) {
    nativeStorage.setItem(testKey, testKey);
    const retrieved = nativeStorage.getItem(testKey);
    nativeStorage.removeItem(testKey);

    if (retrieved === testKey) {
      // Use proxy methods to prevent accidental mutation of the global object
      // if the returned interface is modified by the consumer.
      storageImplementation = {
        getItem: (key) => nativeStorage.getItem(key),
        setItem: (key, val) => nativeStorage.setItem(key, val),
        removeItem: (key) => nativeStorage.removeItem(key),
      };
    }
  }
} catch (e) {
  // Accessing localStorage can throw in certain browser privacy modes
  console.error("LocalStorage access denied or unsupported. Falling back to in-memory storage.", e);
}

/**
 * Modernized replacement for Meteor._localStorage.
 * Falls back to in-memory storage if window.localStorage is unavailable.
 */
export const localStorage: LocalStorageInterface = storageImplementation ?? createInMemoryStorage();