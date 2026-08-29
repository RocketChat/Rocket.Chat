import { faker } from '@faker-js/faker';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { screen, act, renderHook } from '@testing-library/react';

import { useVideoConfOpenCall } from './useVideoConfOpenCall';

/** What `window.open` hands back for the external path: severable, and navigable once severed. */
const openedWindow = () => ({ closed: false, opener: {}, location: { replace: jest.fn() } }) as unknown as Window;

const mountOpenCall = (conferenceWindowEnabled = false) => {
	const { result } = renderHook(() => useVideoConfOpenCall(), {
		wrapper: mockAppRoot().withSetting('VideoConf_Conference_Window_Enabled', conferenceWindowEnabled).build(),
	});

	return (url: string, providerName?: string) => act(() => void result.current(url, providerName));
};

describe('with window.RocketChatDesktop set', () => {
	beforeEach(() => {
		window.RocketChatDesktop = {
			openInternalVideoChatWindow: jest.fn(),
		} as any;
	});

	afterAll(() => {
		delete window.RocketChatDesktop;
	});

	it('should pass to videoConfOpenCall the url', async () => {
		const url = faker.internet.url();

		mountOpenCall()(url);

		expect(window.RocketChatDesktop?.openInternalVideoChatWindow).toHaveBeenCalledWith(url, { providerName: undefined });
	});

	it('should pass to videoConfOpenCall the url and the providerName', async () => {
		const url = faker.internet.url();
		const providerName = faker.lorem.word();

		mountOpenCall()(url, providerName);

		expect(window.RocketChatDesktop?.openInternalVideoChatWindow).toHaveBeenCalledWith(url, {
			providerName,
		});
	});
});

// Without `VideoConf_Conference_Window_Enabled` a call is an ordinary new tab, exactly as it has always been: no
// popup features for a browser to refuse, and no window shared between calls.
describe('without the call window', () => {
	const previousWindowOpen = window.open;

	afterAll(() => {
		window.open = previousWindowOpen;
	});

	it('should open the call in a plain tab', async () => {
		window.open = jest.fn(() => ({}) as Window);

		const url = faker.internet.url();
		mountOpenCall()(url);

		expect(window.open).toHaveBeenCalledTimes(1);
		expect(window.open).toHaveBeenCalledWith(url);
		expect(screen.queryByRole('dialog', { name: 'Open_call_in_new_tab' })).not.toBeInTheDocument();
	});

	// Same-origin or not makes no difference: there is no conference page to share a window with.
	it('should open an in-product URL in a plain tab too, with no shared window name', async () => {
		window.open = jest.fn(() => ({}) as Window);

		const url = `${window.location.origin}/conference/call-dark`;
		mountOpenCall()(url);

		expect(window.open).toHaveBeenCalledWith(url);
	});

	it('should NOT open window, AND open modal instead', async () => {
		window.open = jest.fn(() => null);

		const url = faker.internet.url();
		mountOpenCall()(url);

		expect(window.open).toHaveBeenCalledWith(url);
		expect(window.open).toHaveReturnedWith(null);
		expect(await screen.findByRole('dialog', { name: 'Open_call_in_new_tab' })).toBeInTheDocument();
	});
});

describe('with the call window, for an external provider URL', () => {
	const previousWindowOpen = window.open;

	afterAll(() => {
		window.open = previousWindowOpen;
	});

	it('should open the call as a popout', async () => {
		const target = openedWindow();
		window.open = jest.fn(() => target);

		const url = faker.internet.url();
		mountOpenCall(true)(url);

		expect(window.open).toHaveBeenCalledTimes(1);
		// Opened blank and navigated, rather than opened at the provider — see the opener test below.
		expect(window.open).toHaveBeenCalledWith('', '_blank', expect.stringContaining('popup=yes'));
		expect(target.location.replace).toHaveBeenCalledWith(url);
		expect(screen.queryByRole('dialog', { name: 'Open_call_in_new_tab' })).not.toBeInTheDocument();
	});

	it('should size and centre the popout within the available screen', async () => {
		window.open = jest.fn(() => openedWindow());

		mountOpenCall(true)(faker.internet.url());

		const features = (window.open as jest.Mock).mock.calls[0][2] as string;
		const width = Math.min(1280, window.screen.availWidth);
		const height = Math.min(800, window.screen.availHeight);

		expect(features).toContain(`width=${width}`);
		expect(features).toContain(`height=${height}`);
		expect(features).toContain(`left=${Math.round((window.screen.availWidth - width) / 2)}`);
		expect(features).toContain(`top=${Math.round((window.screen.availHeight - height) / 2)}`);
	});

	// `noopener` in the features would make `window.open` return null, and the handle is what watches the window
	// for closing — which is how leaving a call gets reported. So the severing is done by hand instead.
	it('should never pass noopener, which would cost it the handle it needs', async () => {
		window.open = jest.fn(() => openedWindow());

		mountOpenCall(true)(faker.internet.url());

		expect((window.open as jest.Mock).mock.calls[0][2]).not.toContain('noopener');
	});

	// A provider page with a live `window.opener` can navigate the tab the user came from — a login screen being
	// the obvious thing to imitate. It is cut loose while still blank, which is while it can still be reached.
	it('should sever an external provider window from its opener before sending it there', async () => {
		const target = openedWindow();
		window.open = jest.fn(() => target);

		const url = faker.internet.url();
		mountOpenCall(true)(url);

		expect(target.opener).toBeNull();
		expect(window.open).toHaveBeenCalledWith('', '_blank', expect.anything());
		expect(target.location.replace).toHaveBeenCalledWith(url);
	});

	// A `javascript:` "URL" is not somewhere to go but something to run, and the window opened for an external
	// provider is our own blank one until it navigates — so running it there would be script in this origin.
	it.each(['javascript:alert(document.domain)', 'data:text/html,<script>alert(1)</script>', 'file:///etc/passwd'])(
		'should refuse to send a window to %s',
		async (url) => {
			const target = openedWindow();
			window.open = jest.fn(() => target);

			mountOpenCall(true)(url);

			expect(window.open).not.toHaveBeenCalled();
			expect(target.location.replace).not.toHaveBeenCalled();
		},
	);

	// A window that refuses to let go of its opener is still where the user is trying to go.
	it('should still open the call when the opener cannot be cleared', async () => {
		const target = { closed: false, location: { replace: jest.fn() } } as unknown as Window;
		Object.defineProperty(target, 'opener', {
			get: () => ({}),
			set: () => {
				throw new Error('SecurityError');
			},
		});
		window.open = jest.fn(() => target);

		const url = faker.internet.url();
		mountOpenCall(true)(url);

		expect(target.location.replace).toHaveBeenCalledWith(url);
	});

	it('should fall back to a plain tab when the popout is blocked', async () => {
		const target = openedWindow();
		window.open = jest
			.fn()
			.mockImplementationOnce(() => null)
			.mockImplementationOnce(() => target);

		const url = faker.internet.url();
		mountOpenCall(true)(url);

		expect(window.open).toHaveBeenCalledTimes(2);
		expect(window.open).toHaveBeenNthCalledWith(1, '', '_blank', expect.stringContaining('popup=yes'));
		expect(window.open).toHaveBeenNthCalledWith(2, '', '_blank');
		expect(target.location.replace).toHaveBeenCalledWith(url);
		expect(screen.queryByRole('dialog', { name: 'Open_call_in_new_tab' })).not.toBeInTheDocument();
	});

	it('should treat an already-closed window as blocked and fall back to a tab', async () => {
		window.open = jest
			.fn()
			.mockImplementationOnce(() => ({ closed: true }) as Window)
			.mockImplementationOnce(() => openedWindow());

		mountOpenCall(true)(faker.internet.url());

		expect(window.open).toHaveBeenCalledTimes(2);
	});

	it('should offer the modal when even a plain tab is refused', async () => {
		window.open = jest.fn(() => null);

		mountOpenCall(true)(faker.internet.url());

		expect(await screen.findByRole('dialog', { name: 'Open_call_in_new_tab' })).toBeInTheDocument();
	});
});

describe('with the call window, for an in-product conference URL', () => {
	const previousWindowOpen = window.open;

	// The hook remembers the conference window in module state, which persists across tests. Each test
	// therefore uses a fresh conference id and performs its own setup calls, so its expectations hold
	// whatever a previous test left behind.
	let nextId = 0;
	const conferenceUrl = () => `${window.location.origin}/conference/call-${++nextId}`;

	/** A window that reports itself as showing `url`, the way a real conference window would. */
	// Path *and* search, as a real `Location` has both: a conference about to be started is identified by the room
	// in its query string.
	const windowShowing = (url: string, closed = false) =>
		({ closed, location: { pathname: new URL(url).pathname, search: new URL(url).search } }) as unknown as Window;

	afterAll(() => {
		window.open = previousWindowOpen;
	});

	it('should open the conference as a popout in the shared conference window', async () => {
		const url = conferenceUrl();
		window.open = jest.fn(() => windowShowing(url));

		mountOpenCall(true)(url);

		expect(window.open).toHaveBeenCalledWith(url, 'rocketchat-conference', expect.stringContaining('popup=yes'));
	});

	it('should focus the existing window without reloading or resizing it when the same conference is reopened', async () => {
		const url = conferenceUrl();
		window.open = jest.fn(() => windowShowing(url));

		const openCall = mountOpenCall(true);
		openCall(url);
		(window.open as jest.Mock).mockClear();

		openCall(url);

		// Empty URL means "don't navigate", and no features means the user's window stays where they put it.
		expect(window.open).toHaveBeenCalledWith('', 'rocketchat-conference');
	});

	// A conference the user is about to *start* is identified by the room in its query string, so two of those
	// differ nowhere else — treating them as the same window left the second click focusing the first room.
	it('should navigate the shared window when a different room is about to be called', async () => {
		const first = `${window.location.origin}/conference/new?rid=room-1`;
		const second = `${window.location.origin}/conference/new?rid=room-2`;
		window.open = jest.fn(() => windowShowing(first));

		const openCall = mountOpenCall(true);
		openCall(first);
		(window.open as jest.Mock).mockClear();

		openCall(second);

		expect(window.open).toHaveBeenCalledWith(second, 'rocketchat-conference', expect.any(String));
	});

	it('should navigate the shared window when a different conference is requested', async () => {
		const first = conferenceUrl();
		window.open = jest.fn(() => windowShowing(first));

		const openCall = mountOpenCall(true);
		openCall(first);
		(window.open as jest.Mock).mockClear();

		const second = conferenceUrl();
		openCall(second);

		expect(window.open).toHaveBeenCalledWith(second, 'rocketchat-conference', expect.stringContaining('popup=yes'));
	});

	it('should re-open the conference once its window has been closed', async () => {
		const url = conferenceUrl();
		window.open = jest.fn(() => windowShowing(url, true));

		const openCall = mountOpenCall(true);
		openCall(url);
		(window.open as jest.Mock).mockClear();

		openCall(url);

		expect(window.open).toHaveBeenCalledWith(url, 'rocketchat-conference', expect.stringContaining('popup=yes'));
	});

	it('should fall back to a tab in the shared window when the popout is blocked', async () => {
		const url = conferenceUrl();
		window.open = jest
			.fn()
			.mockImplementationOnce(() => null)
			.mockImplementationOnce(() => windowShowing(url));

		mountOpenCall(true)(url);

		expect(window.open).toHaveBeenNthCalledWith(1, url, 'rocketchat-conference', expect.stringContaining('popup=yes'));
		expect(window.open).toHaveBeenNthCalledWith(2, url, 'rocketchat-conference');
	});
});
