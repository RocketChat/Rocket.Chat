import { STORAGE_KEYS, setStorageBackend } from './storage';

const loginValues = Object.values(STORAGE_KEYS).map((key, index) => [key, `stored-value-${index}`] as const);

describe('storage backend migration', () => {
	beforeEach(() => {
		window.localStorage.clear();
		window.sessionStorage.clear();
		setStorageBackend('local');
	});

	afterEach(() => {
		jest.restoreAllMocks();
		window.localStorage.clear();
		window.sessionStorage.clear();
		setStorageBackend('local');
	});

	it.each(['session', 'local'] as const)('transfers login keys to %s storage without removing unrelated source keys', (backend) => {
		expect(setStorageBackend(backend === 'local' ? 'session' : 'local')).toBe(true);
		const source = backend === 'session' ? window.localStorage : window.sessionStorage;
		const target = backend === 'session' ? window.sessionStorage : window.localStorage;
		for (const [key, value] of loginValues) {
			source.setItem(key, value);
		}
		source.setItem('unrelated', 'keep-this-value');

		expect(setStorageBackend(backend)).toBe(true);

		for (const [key, value] of loginValues) {
			expect(target.getItem(key)).toBe(value);
			expect(source.getItem(key)).toBeNull();
		}
		expect(source.getItem('unrelated')).toBe('keep-this-value');
		expect(target.getItem('unrelated')).toBeNull();
	});

	it.each(['session', 'local'] as const)('preserves source values when a target write to %s storage fails', (backend) => {
		expect(setStorageBackend(backend === 'local' ? 'session' : 'local')).toBe(true);
		const source = backend === 'session' ? window.localStorage : window.sessionStorage;
		const target = backend === 'session' ? window.sessionStorage : window.localStorage;
		for (const [key, value] of loginValues) {
			source.setItem(key, value);
		}
		source.setItem('unrelated', 'keep-this-value');
		const originalSetItem = Storage.prototype.setItem;
		const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
			if (this === target && key === STORAGE_KEYS.LOGIN_TOKEN) {
				throw new DOMException('Storage is full', 'QuotaExceededError');
			}
			originalSetItem.call(this, key, value);
		});

		setStorageBackend(backend);

		expect(setItem).toHaveBeenCalledWith(STORAGE_KEYS.LOGIN_TOKEN, loginValues[1][1]);
		expect(target.getItem(STORAGE_KEYS.LOGIN_TOKEN)).toBeNull();
		expect(source.getItem(STORAGE_KEYS.LOGIN_TOKEN)).toBe(loginValues[1][1]);
		expect(source.getItem('unrelated')).toBe('keep-this-value');
		for (const [key, value] of loginValues) {
			if (key === STORAGE_KEYS.LOGIN_TOKEN) {
				continue;
			}
			expect(target.getItem(key)).toBe(value);
			expect(source.getItem(key)).toBeNull();
		}
	});
});
