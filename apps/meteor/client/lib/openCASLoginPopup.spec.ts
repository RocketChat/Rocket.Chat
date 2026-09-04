import { openCASLoginPopup } from './openCASLoginPopup';

const mockPeek = jest.fn();

jest.mock('meteor/meteor', () => ({
	Meteor: {
		absoluteUrl: jest.fn(() => 'http://localhost:3000/'),
	},
}));

jest.mock('./settings', () => ({
	settings: {
		peek: (...args: unknown[]) => mockPeek(...args),
	},
}));

type PopupMock = {
	closed: boolean;
	close: jest.Mock<void, []>;
	focus: jest.Mock<void, []>;
};

describe('openCASLoginPopup', () => {
	const originalOpen = window.open;

	let popup: PopupMock;

	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();

		(__meteor_runtime_config__ as typeof __meteor_runtime_config__).ROOT_URL_PATH_PREFIX = '';

		mockPeek.mockImplementation((key: string) => {
			switch (key) {
				case 'CAS_login_url':
					return 'http://localhost:3000/cas/login';
				case 'CAS_popup_width':
					return 800;
				case 'CAS_popup_height':
					return 600;
				default:
					return undefined;
			}
		});

		popup = {
			closed: false,
			close: jest.fn(function (this: PopupMock) {
				this.closed = true;
			}),
			focus: jest.fn(),
		};

		window.open = jest.fn(() => popup as unknown as Window);
	});

	afterEach(() => {
		jest.useRealTimers();
		window.open = originalOpen;
	});

	it('resolves when the CAS callback posts a matching completion message', async () => {
		const loginPromise = openCASLoginPopup('token-1');

		window.dispatchEvent(
			new MessageEvent('message', {
				origin: 'http://localhost:3000',
				data: { type: 'cas-login-complete', credentialToken: 'token-1' },
			}),
		);

		await expect(loginPromise).resolves.toBeUndefined();
		expect(popup.focus).toHaveBeenCalledTimes(1);
		expect(popup.close).toHaveBeenCalledTimes(1);
	});

	it('ignores unrelated completion messages and resolves after the popup closes', async () => {
		const loginPromise = openCASLoginPopup('token-1');

		window.dispatchEvent(
			new MessageEvent('message', {
				origin: 'http://localhost:3000',
				data: { type: 'cas-login-complete', credentialToken: 'token-2' },
			}),
		);

		popup.closed = true;
		await jest.advanceTimersByTimeAsync(100);

		await expect(loginPromise).resolves.toBeUndefined();
		expect(popup.close).not.toHaveBeenCalled();
	});

	it('rejects after the timeout when the popup neither closes nor signals completion', async () => {
		const loginPromise = openCASLoginPopup('token-1');

		await jest.advanceTimersByTimeAsync(120_000);

		await expect(loginPromise).rejects.toThrow('CAS login popup timed out before completing authentication');
		expect(popup.close).toHaveBeenCalledTimes(1);
	});

	it('ignores messages from a different origin', async () => {
		const loginPromise = openCASLoginPopup('token-1');

		window.dispatchEvent(
			new MessageEvent('message', {
				origin: 'https://example.com',
				data: { type: 'cas-login-complete', credentialToken: 'token-1' },
			}),
		);

		popup.closed = true;
		await jest.advanceTimersByTimeAsync(100);

		await expect(loginPromise).resolves.toBeUndefined();
		expect(popup.close).not.toHaveBeenCalled();
	});
});
