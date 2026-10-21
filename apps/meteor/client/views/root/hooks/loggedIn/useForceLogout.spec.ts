import { renderHook } from '@testing-library/react';

import { useForceLogout } from './useForceLogout';

const setForceLogout = jest.fn();
const wipeLocalAuth = jest.fn();
let forceLogoutListener: (sessionId?: string) => void = () => undefined;

jest.mock('@rocket.chat/ui-contexts', () => ({
	useStream: () => (_key: string, callback: (sessionId?: string) => void) => {
		forceLogoutListener = callback;
		return () => undefined;
	},
	useSessionDispatch: () => setForceLogout,
	useWipeLocalAuth: () => wipeLocalAuth,
}));

jest.mock('../../../../lib/sdk/sdkTransportEnabled', () => ({ isSdkTransportEnabled: () => true }));

jest.mock('../../../../meteor/connection', () => ({ getConnectionSessionId: () => 'this-session' }));

describe('useForceLogout', () => {
	beforeEach(() => {
		setForceLogout.mockClear();
		wipeLocalAuth.mockClear();
		renderHook(() => useForceLogout('user-id'));
		setForceLogout.mockClear();
	});

	it('ignores a logout aimed at another session of the user', () => {
		forceLogoutListener('other-session');
		expect(setForceLogout).not.toHaveBeenCalled();
		expect(wipeLocalAuth).not.toHaveBeenCalled();
	});

	it('logs out when the logout names this session', () => {
		forceLogoutListener('this-session');
		expect(setForceLogout).toHaveBeenCalledWith(true);
		expect(wipeLocalAuth).toHaveBeenCalledTimes(1);
	});

	it('logs out when the logout names no session, as for every session of the user', () => {
		forceLogoutListener(undefined);
		expect(setForceLogout).toHaveBeenCalledWith(true);
		expect(wipeLocalAuth).toHaveBeenCalledTimes(1);
	});
});
