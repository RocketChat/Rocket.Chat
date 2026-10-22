import { Emitter } from '@rocket.chat/emitter';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import { useRef, useCallback, useSyncExternalStore, useState } from 'react';

const ee = new Emitter<Record<`fuselage-${string}`, any>>();

const getWindowStorage = (storageType: 'localStorage' | 'sessionStorage'): Storage | undefined => {
	try {
		return typeof window === 'undefined' ? undefined : window[storageType];
	} catch {
		return undefined;
	}
};

const getKeyPrefix = (storage: Storage | undefined) => {
	if (!storage) return 'fuselage-unknownStorage' as const;

	try {
		if (storage === globalThis.window?.sessionStorage) {
			return 'fuselage-sessionStorage' as const;
		}

		if (storage === globalThis.window?.localStorage) {
			return 'fuselage-localStorage' as const;
		}
	} catch {
		return 'fuselage-unknownStorage' as const;
	}

	return 'fuselage-unknownStorage' as const;
};

const getStorageItem = <T>(storedKey: `fuselage-${string}`, fallbackValue: T, storage?: Storage): T => {
	if (!storage) return fallbackValue;

	try {
		const item = storage.getItem(storedKey);
		return item ? JSON.parse(item) : fallbackValue;
	} catch {
		return fallbackValue;
	}
};

const setStorageItem = <T>(storedKey: `fuselage-${string}`, value: T, storage?: Storage): void => {
	if (!storage) return;

	const serialized = JSON.stringify(value);
	try {
		storage.setItem(storedKey, serialized);
	} catch {
		// Ignore write errors (quota exceeded, private browsing restrictions)
	}
	ee.emit(storedKey, value);
};

/**
 * Generic hook to deal with web storage
 *
 * @param storage - the storage to use (localStorage or sessionStorage); if undefined, the hook will be a no-op
 * @param key - the key to associate with the value
 * @param fallbackValue - the value to return if the key is not found
 * @returns a state and a setter function
 */
export const useStorage = <T>(storage: Storage | undefined, key: string, fallbackValue: T): [T, Dispatch<SetStateAction<T>>] => {
	const storedKey = `${getKeyPrefix(storage)}-${key}` as const;

	const fallbackValueRef = useRef(fallbackValue);
	fallbackValueRef.current = fallbackValue;

	const [valueRef] = useState<RefObject<T>>(() => ({
		current: getStorageItem(storedKey, fallbackValue, storage),
	}));

	const getSnapshot = useCallback(() => valueRef.current, [valueRef]);

	const getServerSnapshot = useCallback(() => fallbackValueRef.current, []);

	const subscribe = useCallback(
		(cb: () => void) => {
			const handleEvent = (event: StorageEvent): void => {
				if (event.storageArea !== storage) return;
				if (event.key !== storedKey) return;

				let parsedValue: T;
				try {
					parsedValue = event.newValue ? JSON.parse(event.newValue) : fallbackValueRef.current;
				} catch {
					parsedValue = fallbackValueRef.current;
				}
				ee.emit(storedKey, parsedValue);
			};

			const offCb = ee.on(storedKey, (value: T): void => {
				valueRef.current = value;
				cb();
			});

			window.addEventListener('storage', handleEvent);
			return () => {
				offCb();
				window.removeEventListener('storage', handleEvent);
			};
		},
		[storage, storedKey, valueRef],
	);

	const storedValue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

	const setValue: Dispatch<SetStateAction<T>> = useCallback(
		(value) => {
			const valueToStore: T = value instanceof Function ? value(valueRef.current) : value;
			setStorageItem(storedKey, valueToStore, storage);
			return valueToStore;
		},
		[storage, storedKey, valueRef],
	);

	return [storedValue, setValue];
};

/**
 * Hook to deal with localStorage
 * @param key - the key associated to the value in the storage
 * @param initialValue - the value returned when the key is not found at the storage
 * @returns a state and a setter function
 * @public
 */
export const useLocalStorage = useStorage.bind(null, getWindowStorage('localStorage')) as <T>(
	key: string,
	fallbackValue: T,
) => [T, Dispatch<SetStateAction<T>>];

/**
 * Hook to deal with sessionStorage
 * @param key - the key associated to the value in the storage
 * @param initialValue - the value returned when the key is not found at the storage
 * @returns a state and a setter function
 * @public
 */
export const useSessionStorage = useStorage.bind(null, getWindowStorage('sessionStorage')) as <T>(
	key: string,
	fallbackValue: T,
) => [T, Dispatch<SetStateAction<T>>];
