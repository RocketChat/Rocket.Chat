import { FAKE_BACKEND_STORAGE_KEY, getSearchIndexBackend } from './getSearchIndexBackend';

const mockBrowser = { open: jest.fn() };
const mockCreateBrowser = jest.fn((..._args: unknown[]) => mockBrowser);
jest.mock('../absoluteUrl', () => ({ absoluteUrl: (path = '') => `https://chat.example/a/${path}` }));
jest.mock('./browser/canRunBrowserBackend', () => ({ canRunBrowserBackend: () => true }));
jest.mock('./browser/sqliteSearchIndexBackend', () => ({
	createSqliteSearchIndexBackend: (...args: unknown[]) => mockCreateBrowser(...args),
}));
jest.mock('./browser/sharedSqlRunner', () => ({ createSharedSqlRunner: jest.fn(() => ({})) }));
jest.mock('./browser/workerSqlRunner', () => ({ createWorkerSqlRunner: jest.fn() }));

const originalEnvironment = process.env.NODE_ENV;
afterEach(() => {
	delete window.RocketChatDesktop;
	window.localStorage.clear();
	(process.env as Record<string, string | undefined>).NODE_ENV = originalEnvironment;
});

describe('search backend selection', () => {
	it('never creates a browser fallback for an unsupported desktop', () => {
		window.RocketChatDesktop = {} as NonNullable<Window['RocketChatDesktop']>;
		expect(getSearchIndexBackend()).toBeUndefined();
		expect(mockCreateBrowser).not.toHaveBeenCalled();
	});

	it('caches browser storage under the workspace root', () => {
		expect(getSearchIndexBackend()).toBe(mockBrowser);
		expect(getSearchIndexBackend()).toBe(mockBrowser);
		expect(mockCreateBrowser).toHaveBeenCalledTimes(1);
		expect(mockCreateBrowser).toHaveBeenCalledWith(expect.anything(), { namespace: 'https://chat.example/a/' });
	});

	it('uses the memory backend only with explicit development opt-in', async () => {
		(process.env as Record<string, string>).NODE_ENV = 'development';
		window.localStorage.setItem(FAKE_BACKEND_STORAGE_KEY, 'true');
		const backend = getSearchIndexBackend();
		expect(backend).not.toBe(mockBrowser);
		await expect(backend?.open({ userId: 'u' })).resolves.toMatchObject({ encryptedAtRest: false, capabilities: { recentCursor: 1 } });
		await backend?.close?.();
		(process.env as Record<string, string>).NODE_ENV = 'production';
		expect(getSearchIndexBackend()).toBe(mockBrowser);
	});
});
