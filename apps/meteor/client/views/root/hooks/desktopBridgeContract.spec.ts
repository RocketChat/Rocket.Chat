import type { IUser } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useDesktopUnreadAlert } from './loggedIn/useDesktopUnreadAlert';
import { useDesktopBridgeContract } from './useDesktopBridgeContract';
import { useDesktopOutlookCredentials } from './useDesktopOutlookCredentials';
import { useDesktopUserLoggedIn } from './useDesktopUserLoggedIn';

jest.mock('../../../../rocketchat.info', () => ({
	Info: { version: '9.0.0', commit: { hash: 'abc123' } },
}));

let mockIsLoggingIn = false;
let mockUser: Pick<IUser, '_id' | 'settings'> | null = null;
// `null` keeps the user id of the `mockAppRoot` wrapper.
let mockUserId: string | undefined | null = null;

jest.mock('@rocket.chat/ui-contexts', () => {
	const actual = jest.requireActual('@rocket.chat/ui-contexts');
	return {
		...actual,
		useLoginToken: () => 'login-token',
		useIsLoggingIn: () => mockIsLoggingIn,
		useUser: () => mockUser,
		useUserId: () => (mockUserId === null ? actual.useUserId() : mockUserId),
	};
});

const mockDesktop = () => {
	const desktop = {
		setWebClientBridgeVersion: jest.fn(),
		setServerInfo: jest.fn(),
		setGitCommitHash: jest.fn(),
		setUserLoggedIn: jest.fn(),
		setUnreadAlertEnabled: jest.fn(),
		setUserToken: jest.fn(),
		setOutlookExchangeUrl: jest.fn(),
		clearOutlookCredentials: jest.fn(),
	};
	Object.assign(window, { RocketChatDesktop: desktop });
	return desktop;
};

afterEach(() => {
	mockIsLoggingIn = false;
	mockUser = null;
	mockUserId = null;
	jest.restoreAllMocks();
	delete (window as { RocketChatDesktop?: unknown }).RocketChatDesktop;
});

describe('useDesktopBridgeContract', () => {
	it('should announce the contract version and the server build', () => {
		const desktop = mockDesktop();

		renderHook(() => useDesktopBridgeContract(), { wrapper: mockAppRoot().build() });

		expect(desktop.setWebClientBridgeVersion).toHaveBeenCalledWith(1);
		expect(desktop.setServerInfo).toHaveBeenCalledWith(expect.objectContaining({ version: '9.0.0' }));
		expect(desktop.setGitCommitHash).toHaveBeenCalledWith('abc123');
	});

	it('should still send the server build to desktop apps that predate the handshake', () => {
		const { setWebClientBridgeVersion: _, ...desktop } = mockDesktop();
		Object.assign(window, { RocketChatDesktop: desktop });

		renderHook(() => useDesktopBridgeContract(), { wrapper: mockAppRoot().build() });

		expect(desktop.setServerInfo).toHaveBeenCalledTimes(1);
	});

	it('should announce the contract once, not on every render', () => {
		const desktop = mockDesktop();

		const { rerender } = renderHook(() => useDesktopBridgeContract(), { wrapper: mockAppRoot().build() });
		rerender();
		rerender();

		expect(desktop.setWebClientBridgeVersion).toHaveBeenCalledTimes(1);
		expect(desktop.setServerInfo).toHaveBeenCalledTimes(1);
		expect(desktop.setGitCommitHash).toHaveBeenCalledTimes(1);
	});
});

describe('useDesktopUserLoggedIn', () => {
	it('should tell the desktop app a user is logged in', () => {
		const desktop = mockDesktop();

		renderHook(() => useDesktopUserLoggedIn(), { wrapper: mockAppRoot().withJohnDoe().build() });

		expect(desktop.setUserLoggedIn).toHaveBeenLastCalledWith(true);
	});

	it('should tell the desktop app nobody is logged in', () => {
		const desktop = mockDesktop();

		renderHook(() => useDesktopUserLoggedIn(), { wrapper: mockAppRoot().build() });

		expect(desktop.setUserLoggedIn).toHaveBeenLastCalledWith(false);
	});

	it('should not report a logout while a stored session resumes', () => {
		const desktop = mockDesktop();
		mockIsLoggingIn = true;

		const { rerender } = renderHook(() => useDesktopUserLoggedIn(), { wrapper: mockAppRoot().build() });

		expect(desktop.setUserLoggedIn).not.toHaveBeenCalled();

		mockIsLoggingIn = false;
		rerender();

		expect(desktop.setUserLoggedIn).toHaveBeenLastCalledWith(false);
	});

	// The Vite build starts the resume with no user id and sets it when the resume succeeds.
	it('should report only the login when a stored session resumes on reload', () => {
		const desktop = mockDesktop();
		mockUserId = undefined;
		mockIsLoggingIn = true;

		const { rerender } = renderHook(() => useDesktopUserLoggedIn(), { wrapper: mockAppRoot().build() });

		mockUserId = 'user-id';
		rerender();
		mockIsLoggingIn = false;
		rerender();

		expect(desktop.setUserLoggedIn).not.toHaveBeenCalledWith(false);
		expect(desktop.setUserLoggedIn).toHaveBeenLastCalledWith(true);
	});

	// Meteor's accounts-base presents the stored user id while the resume is in flight, and drops it when the resume fails.
	it('should report the logout when the optimistic user id of a failed resume goes away', () => {
		const desktop = mockDesktop();
		mockUserId = 'user-id';
		mockIsLoggingIn = true;

		const { rerender } = renderHook(() => useDesktopUserLoggedIn(), { wrapper: mockAppRoot().build() });

		expect(desktop.setUserLoggedIn).toHaveBeenLastCalledWith(true);

		mockIsLoggingIn = false;
		rerender();
		mockUserId = undefined;
		rerender();

		expect(desktop.setUserLoggedIn).toHaveBeenLastCalledWith(false);
	});
});

describe('useDesktopUnreadAlert', () => {
	it('should enable the unread alert unless the user turned it off', () => {
		const desktop = mockDesktop();

		renderHook(() => useDesktopUnreadAlert(), { wrapper: mockAppRoot().withJohnDoe().build() });

		expect(desktop.setUnreadAlertEnabled).toHaveBeenLastCalledWith(true);
	});

	it('should disable the unread alert when the user turned it off', () => {
		const desktop = mockDesktop();

		renderHook(() => useDesktopUnreadAlert(), {
			wrapper: mockAppRoot().withJohnDoe().withUserPreference('unreadAlert', false).build(),
		});

		expect(desktop.setUnreadAlertEnabled).toHaveBeenLastCalledWith(false);
	});
});

describe('useDesktopOutlookCredentials', () => {
	const outlookUser = (enabled: boolean) => ({
		_id: 'user-id',
		settings: { calendar: { outlook: { Enabled: enabled, Exchange_Url: 'https://exchange.example.com', Outlook_Url: '' } } },
	});

	it('should hand the Outlook integration its credentials when the user enabled it', () => {
		const desktop = mockDesktop();
		mockUser = outlookUser(true);

		renderHook(() => useDesktopOutlookCredentials(), { wrapper: mockAppRoot().build() });

		expect(desktop.setUserToken).toHaveBeenCalledWith('login-token', 'user-id');
		expect(desktop.setOutlookExchangeUrl).toHaveBeenCalledWith('https://exchange.example.com', 'user-id');
	});

	it('should not hand over the login token when the user did not enable the integration', () => {
		const desktop = mockDesktop();
		mockUser = outlookUser(false);

		const { rerender } = renderHook(() => useDesktopOutlookCredentials(), { wrapper: mockAppRoot().build() });
		rerender();

		expect(desktop.setUserToken).not.toHaveBeenCalled();
		// An earlier page load may have handed credentials over before the user turned the integration off.
		expect(desktop.clearOutlookCredentials).toHaveBeenCalledTimes(1);
	});

	it('should take back the credentials an earlier page load left when a reload ends logged out', () => {
		const desktop = mockDesktop();
		mockIsLoggingIn = true;

		const { rerender } = renderHook(() => useDesktopOutlookCredentials(), { wrapper: mockAppRoot().build() });

		expect(desktop.clearOutlookCredentials).not.toHaveBeenCalled();

		mockIsLoggingIn = false;
		rerender();
		rerender();

		expect(desktop.clearOutlookCredentials).toHaveBeenCalledTimes(1);
	});

	it('should not take the credentials back while the user of a stored user id loads', () => {
		const desktop = mockDesktop();
		mockUserId = 'user-id';

		const { rerender } = renderHook(() => useDesktopOutlookCredentials(), { wrapper: mockAppRoot().build() });

		mockUser = outlookUser(true);
		rerender();

		expect(desktop.clearOutlookCredentials).not.toHaveBeenCalled();
		expect(desktop.setUserToken).toHaveBeenCalledTimes(1);
	});

	it.each([
		['turns the integration off', () => outlookUser(false)],
		['logs out', () => null],
	])('should take the credentials back when the user %s', (_name, nextUser) => {
		const desktop = mockDesktop();
		mockUser = outlookUser(true);

		const { rerender } = renderHook(() => useDesktopOutlookCredentials(), { wrapper: mockAppRoot().build() });

		mockUser = nextUser();
		rerender();
		rerender();

		expect(desktop.clearOutlookCredentials).toHaveBeenCalledTimes(1);
	});

	it('should not take the credentials back while a stored session resumes on reload', () => {
		const desktop = mockDesktop();
		mockIsLoggingIn = true;

		const { rerender } = renderHook(() => useDesktopOutlookCredentials(), { wrapper: mockAppRoot().build() });

		mockUser = outlookUser(true);
		mockIsLoggingIn = false;
		rerender();

		expect(desktop.clearOutlookCredentials).not.toHaveBeenCalled();
		expect(desktop.setUserToken).toHaveBeenCalledTimes(1);
	});

	it('should hand the credentials over again when the user logs back in', () => {
		const desktop = mockDesktop();
		mockUser = outlookUser(true);

		const { rerender } = renderHook(() => useDesktopOutlookCredentials(), { wrapper: mockAppRoot().build() });

		mockUser = null;
		rerender();
		mockUser = outlookUser(true);
		rerender();

		expect(desktop.setUserToken).toHaveBeenCalledTimes(2);
		expect(desktop.setOutlookExchangeUrl).toHaveBeenCalledTimes(2);
		expect(desktop.clearOutlookCredentials).toHaveBeenCalledTimes(1);
	});

	it('should skip the Outlook calls quietly on desktop apps that predate the Outlook integration', () => {
		const { setUserToken: _token, setOutlookExchangeUrl: _url, clearOutlookCredentials: _clear, ...desktop } = mockDesktop();
		Object.assign(window, { RocketChatDesktop: desktop });
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
		mockUser = outlookUser(true);

		const { rerender } = renderHook(() => useDesktopOutlookCredentials(), { wrapper: mockAppRoot().build() });

		mockUser = null;
		rerender();

		expect(warn).not.toHaveBeenCalled();
	});
});
