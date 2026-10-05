import { renderHook } from '@testing-library/react';

import { useStoreCookiesOnLogin } from './useStoreCookiesOnLogin';

const state = {
	isLoggingIn: false as boolean | undefined,
	loginToken: 'test-token' as string | null | undefined,
};

jest.mock('@rocket.chat/ui-contexts', () => ({
	useIsLoggingIn: () => state.isLoggingIn,
	useLoginToken: () => state.loginToken,
}));

describe('useStoreCookiesOnLogin', () => {
	const cookiesSet: string[] = [];

	beforeEach(() => {
		cookiesSet.length = 0;
		state.isLoggingIn = false;
		state.loginToken = 'test-token';

		jest.spyOn(document, 'cookie', 'set').mockImplementation((cookie: string) => {
			cookiesSet.push(cookie);
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should set rc_uid and rc_token with SameSite=Lax on HTTP', () => {
		renderHook(() => useStoreCookiesOnLogin('user-123'));

		expect(cookiesSet).toEqual([
			'rc_uid=user-123; path=/; SameSite=Lax',
			'rc_token=test-token; path=/; SameSite=Lax',
		]);
	});

	it('should include secure flag when protocol is HTTPS', () => {
		const originalLocation = window.location;
		delete (window as any).location;
		window.location = { ...originalLocation, protocol: 'https:' } as any;

		renderHook(() => useStoreCookiesOnLogin('user-123'));

		expect(cookiesSet).toEqual([
			'rc_uid=user-123; path=/; SameSite=Lax; secure',
			'rc_token=test-token; path=/; SameSite=Lax; secure',
		]);

		window.location = originalLocation;
	});

	it('should not set cookies while isLoggingIn is true', () => {
		state.isLoggingIn = true;

		renderHook(() => useStoreCookiesOnLogin('user-123'));

		expect(cookiesSet).toHaveLength(0);
	});
});
