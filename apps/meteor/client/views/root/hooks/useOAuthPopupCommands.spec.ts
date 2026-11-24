import { BroadcastChannel } from 'node:worker_threads';

import { renderHook, waitFor } from '@testing-library/react';

import { useOAuthPopupCommands } from './useOAuthPopupCommands';
import { router } from '../../../providers/RouterProvider';

jest.mock('../../../providers/RouterProvider', () => ({
	router: {
		navigate: jest.fn(),
		getLocationPathname: () => '/channel/general',
		getSearchParameters: () => ({ layout: 'embedded' }),
	},
}));

Object.assign(window, { BroadcastChannel });

describe('useOAuthPopupCommands', () => {
	it('should show a refused popup login on the page the user started it from', () => {
		renderHook(() => useOAuthPopupCommands());

		window.dispatchEvent(
			new MessageEvent('message', {
				origin: window.location.origin,
				data: { oauthPopupCommand: 'login-error', oauthError: 'error-invalid-username' },
			}),
		);

		expect(router.navigate).toHaveBeenCalledWith({
			pathname: '/channel/general',
			search: { layout: 'embedded', oauthError: 'error-invalid-username' },
		});
	});

	it('should ignore a popup command that another site posts to the page', () => {
		jest.mocked(router.navigate).mockClear();
		renderHook(() => useOAuthPopupCommands());

		window.dispatchEvent(
			new MessageEvent('message', {
				origin: 'https://attacker.example.com',
				data: { oauthPopupCommand: 'login-error', oauthError: 'error-invalid-username' },
			}),
		);

		expect(router.navigate).not.toHaveBeenCalled();
	});

	it('should show a refused popup login that reaches the page through the channel when the popup has no opener', async () => {
		renderHook(() => useOAuthPopupCommands());

		const popup = new BroadcastChannel('oauth-popup');
		popup.postMessage({ oauthPopupCommand: 'login-error', oauthError: 'error-oauth-login-failed' });
		popup.close();

		await waitFor(() =>
			expect(router.navigate).toHaveBeenCalledWith({
				pathname: '/channel/general',
				search: { layout: 'embedded', oauthError: 'error-oauth-login-failed' },
			}),
		);
	});
});
