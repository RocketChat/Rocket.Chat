import { faker } from '@faker-js/faker';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { screen, act, renderHook } from '@testing-library/react';

import { useVideoConfOpenCall } from './useVideoConfOpenCall';

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
		const { result } = renderHook(() => useVideoConfOpenCall(), { wrapper: mockAppRoot().build() });

		const url = faker.internet.url();

		act(() => {
			result.current(url);
		});

		expect(window.RocketChatDesktop?.openInternalVideoChatWindow).toHaveBeenCalledWith(url, { providerName: undefined });
	});

	it('should pass to videoConfOpenCall the url and the providerName', async () => {
		const { result } = renderHook(() => useVideoConfOpenCall(), { wrapper: mockAppRoot().build() });

		const url = faker.internet.url();
		const providerName = faker.lorem.word();

		act(() => {
			result.current(url, providerName);
		});

		expect(window.RocketChatDesktop?.openInternalVideoChatWindow).toHaveBeenCalledWith(url, {
			providerName,
		});
	});
});

describe('without window.RocketChatDesktop set', () => {
	const previousWindowOpen = window.open;

	const openCall = (url: string) => {
		const { result } = renderHook(() => useVideoConfOpenCall(), { wrapper: mockAppRoot().build() });
		act(() => {
			result.current(url);
		});
	};

	afterAll(() => {
		window.open = previousWindowOpen;
	});

	it('should open the call as a popout', async () => {
		window.open = jest.fn(() => ({ closed: false }) as Window);

		const url = faker.internet.url();
		openCall(url);

		expect(window.open).toHaveBeenCalledTimes(1);
		expect(window.open).toHaveBeenCalledWith(url, '_blank', expect.stringContaining('popup=yes'));
		expect(screen.queryByRole('dialog', { name: 'Open_call_in_new_tab' })).not.toBeInTheDocument();
	});

	it('should size and centre the popout within the available screen', async () => {
		window.open = jest.fn(() => ({ closed: false }) as Window);

		openCall(faker.internet.url());

		const features = (window.open as jest.Mock).mock.calls[0][2] as string;
		const width = Math.min(1280, window.screen.availWidth);
		const height = Math.min(800, window.screen.availHeight);

		expect(features).toContain(`width=${width}`);
		expect(features).toContain(`height=${height}`);
		expect(features).toContain(`left=${Math.round((window.screen.availWidth - width) / 2)}`);
		expect(features).toContain(`top=${Math.round((window.screen.availHeight - height) / 2)}`);
	});

	it('should never pass noopener, which would sever the conference window from its opener', async () => {
		window.open = jest.fn(() => ({ closed: false }) as Window);

		openCall(faker.internet.url());

		expect((window.open as jest.Mock).mock.calls[0][2]).not.toContain('noopener');
	});

	it('should fall back to a plain tab when the popout is blocked', async () => {
		window.open = jest
			.fn()
			.mockImplementationOnce(() => null)
			.mockImplementationOnce(() => ({ closed: false }) as Window);

		const url = faker.internet.url();
		openCall(url);

		expect(window.open).toHaveBeenCalledTimes(2);
		expect(window.open).toHaveBeenNthCalledWith(1, url, '_blank', expect.stringContaining('popup=yes'));
		expect(window.open).toHaveBeenNthCalledWith(2, url, '_blank');
		expect(screen.queryByRole('dialog', { name: 'Open_call_in_new_tab' })).not.toBeInTheDocument();
	});

	it('should treat an already-closed window as blocked and fall back to a tab', async () => {
		window.open = jest
			.fn()
			.mockImplementationOnce(() => ({ closed: true }) as Window)
			.mockImplementationOnce(() => ({ closed: false }) as Window);

		openCall(faker.internet.url());

		expect(window.open).toHaveBeenCalledTimes(2);
	});

	it('should NOT open window, AND open modal instead', async () => {
		window.open = jest.fn(() => null);

		const url = faker.internet.url();
		openCall(url);

		expect(window.open).toHaveBeenCalledWith(url, '_blank', expect.stringContaining('popup=yes'));
		expect(window.open).toHaveReturnedWith(null);
		expect(await screen.findByRole('dialog', { name: 'Open_call_in_new_tab' })).toBeInTheDocument();
	});
});

describe('with an in-product conference URL', () => {
	const previousWindowOpen = window.open;

	// The hook remembers the conference window in module state, which persists across tests. Each test
	// therefore uses a fresh conference id and performs its own setup calls, so its expectations hold
	// whatever a previous test left behind.
	let nextId = 0;
	const conferenceUrl = () => `${window.location.origin}/conference/call-${++nextId}`;

	const renderOpenCall = () => {
		const { result } = renderHook(() => useVideoConfOpenCall(), { wrapper: mockAppRoot().build() });
		return (url: string) => act(() => result.current(url));
	};

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

		renderOpenCall()(url);

		expect(window.open).toHaveBeenCalledWith(url, 'rocketchat-conference', expect.stringContaining('popup=yes'));
	});

	it('should focus the existing window without reloading or resizing it when the same conference is reopened', async () => {
		const url = conferenceUrl();
		window.open = jest.fn(() => windowShowing(url));

		const openCall = renderOpenCall();
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

		const openCall = renderOpenCall();
		await openCall(first);
		(window.open as jest.Mock).mockClear();

		await openCall(second);

		expect(window.open).toHaveBeenCalledWith(second, 'rocketchat-conference', expect.any(String));
	});

	it('should navigate the shared window when a different conference is requested', async () => {
		const first = conferenceUrl();
		window.open = jest.fn(() => windowShowing(first));

		const openCall = renderOpenCall();
		openCall(first);
		(window.open as jest.Mock).mockClear();

		const second = conferenceUrl();
		openCall(second);

		expect(window.open).toHaveBeenCalledWith(second, 'rocketchat-conference', expect.stringContaining('popup=yes'));
	});

	it('should re-open the conference once its window has been closed', async () => {
		const url = conferenceUrl();
		window.open = jest.fn(() => windowShowing(url, true));

		const openCall = renderOpenCall();
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

		renderOpenCall()(url);

		expect(window.open).toHaveBeenNthCalledWith(1, url, 'rocketchat-conference', expect.stringContaining('popup=yes'));
		expect(window.open).toHaveBeenNthCalledWith(2, url, 'rocketchat-conference');
	});
});
