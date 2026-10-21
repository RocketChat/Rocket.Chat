import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useDesktopOutlookCredentials } from './loggedIn/useDesktopOutlookCredentials';
import { useDesktopUnreadAlert } from './loggedIn/useDesktopUnreadAlert';
import { useDesktopBridgeContract } from './useDesktopBridgeContract';
import { useDesktopUserLoggedIn } from './useDesktopUserLoggedIn';

jest.mock('../../../../rocketchat.info', () => ({
	Info: { version: '9.0.0', commit: { hash: 'abc123' } },
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useLoginToken: () => 'login-token',
}));

const mockDesktop = () => {
	const desktop = {
		setWebClientBridgeVersion: jest.fn(),
		setServerInfo: jest.fn(),
		setGitCommitHash: jest.fn(),
		setUserLoggedIn: jest.fn(),
		setUnreadAlertEnabled: jest.fn(),
		setUserToken: jest.fn(),
		setOutlookExchangeUrl: jest.fn(),
	};
	Object.assign(window, { RocketChatDesktop: desktop });
	return desktop;
};

afterEach(() => {
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

		renderHook(() => useDesktopOutlookCredentials(outlookUser(true)), { wrapper: mockAppRoot().build() });

		expect(desktop.setUserToken).toHaveBeenCalledWith('login-token', 'user-id');
		expect(desktop.setOutlookExchangeUrl).toHaveBeenCalledWith('https://exchange.example.com', 'user-id');
	});

	it('should not hand over the login token when the user did not enable the integration', () => {
		const desktop = mockDesktop();

		renderHook(() => useDesktopOutlookCredentials(outlookUser(false)), { wrapper: mockAppRoot().build() });

		expect(desktop.setUserToken).not.toHaveBeenCalled();
		expect(desktop.setOutlookExchangeUrl).not.toHaveBeenCalled();
	});
});
