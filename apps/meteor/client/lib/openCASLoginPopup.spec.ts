import { Meteor } from 'meteor/meteor';

import { openCASLoginPopup } from './openCASLoginPopup';

const mockPeek = jest.fn();

jest.mock('./settings', () => ({
	settings: {
		peek: (...args: unknown[]) => mockPeek(...args),
	},
}));

jest.mock('meteor/meteor', () => ({
	Meteor: {
		absoluteUrl: jest.fn(),
	},
}));

describe('openCASLoginPopup', () => {
	const originalRuntimeConfig = (global as any).__meteor_runtime_config__;
	let openSpy: jest.SpyInstance;

	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		mockPeek.mockImplementation((key: string) => {
			switch (key) {
				case 'CAS_login_url':
					return 'https://cas.example.com/login';
				case 'CAS_popup_width':
					return 800;
				case 'CAS_popup_height':
					return 600;
				default:
					return undefined;
			}
		});

		(Meteor.absoluteUrl as jest.Mock).mockReturnValue('https://chat.example.com/');
		(global as any).__meteor_runtime_config__ = { ROOT_URL_PATH_PREFIX: '' };
		openSpy = jest.spyOn(window, 'open').mockReturnValue({ focus: jest.fn(), closed: false } as unknown as Window);
	});

	afterEach(() => {
		jest.useRealTimers();
		openSpy.mockRestore();
		(global as any).__meteor_runtime_config__ = originalRuntimeConfig;
	});

	it('resolves when the popup closes', async () => {
		const popup = { focus: jest.fn(), closed: false } as unknown as Window;
		(window.open as jest.Mock).mockReturnValue(popup);

		const promise = openCASLoginPopup('credential-token');

		await jest.advanceTimersByTimeAsync(100);
		(popup as { closed: boolean }).closed = true;
		await jest.advanceTimersByTimeAsync(100);

		await expect(promise).resolves.toBeUndefined();
		expect(window.open).toHaveBeenCalledWith(
			'https://cas.example.com/login?service=https%3A%2F%2Fchat.example.com%2F_cas%2Fcredential-token',
			'Login',
			expect.stringContaining('width=800'),
		);
	});

	it('rejects if the popup stays open too long', async () => {
		const popup = { focus: jest.fn(), closed: false } as unknown as Window;
		(window.open as jest.Mock).mockReturnValue(popup);

		const promise = openCASLoginPopup('credential-token');

		await jest.advanceTimersByTimeAsync(5 * 60 * 1000);

		await expect(promise).rejects.toThrow('CAS login popup did not close in time');
	});
});
