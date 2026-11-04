import { openAppHome } from './openAppHome';

const mockFindHome = jest.fn();

jest.mock('@rocket.chat/logger', () => ({ Logger: jest.fn(() => ({ error: jest.fn() })) }));
jest.mock('@rocket.chat/models', () => ({
	UiKitViews: { findHomeViewByAppIdAndUserId: (...args: unknown[]) => mockFindHome(...args) },
}));

const home = { appId: 'app', id: 'home', blocks: [] };

beforeEach(() => mockFindHome.mockReset());

describe('openAppHome', () => {
	it('returns the stored home and tells the app it was opened with it', async () => {
		mockFindHome.mockResolvedValue({ view: home });
		const notifyApp = jest.fn().mockResolvedValue(undefined);

		const view = await openAppHome('app', 'user', notifyApp);

		expect(mockFindHome).toHaveBeenCalledWith('app', 'user');
		expect(view).toBe(home);
		expect(notifyApp).toHaveBeenCalledWith(expect.any(String), home);
	});

	it('returns nothing, and still tells the app, when no home was published yet', async () => {
		mockFindHome.mockResolvedValue(null);
		const notifyApp = jest.fn().mockResolvedValue(undefined);

		expect(await openAppHome('app', 'user', notifyApp)).toBeUndefined();
		expect(notifyApp).toHaveBeenCalledWith(expect.any(String), undefined);
	});

	it('still returns the home when the app fails to handle the event', async () => {
		mockFindHome.mockResolvedValue({ view: home });

		await expect(openAppHome('app', 'user', jest.fn().mockRejectedValue(new Error('boom')))).resolves.toBe(home);
	});
});
