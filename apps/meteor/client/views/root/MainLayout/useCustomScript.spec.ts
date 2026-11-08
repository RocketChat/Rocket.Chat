import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useCustomScript } from './useCustomScript';
import { fireGlobalEvent } from '../../../lib/utils/fireGlobalEvent';

jest.mock('../../../lib/utils/fireGlobalEvent', () => ({
	fireGlobalEvent: jest.fn(),
}));

let mockUserId: string | undefined;
let mockIsLoggingIn = false;

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useUserId: () => mockUserId,
	useIsLoggingIn: () => mockIsLoggingIn,
}));

const firedEvents = () => jest.mocked(fireGlobalEvent).mock.calls.map(([eventName]) => eventName);

afterEach(() => {
	mockUserId = undefined;
	mockIsLoggingIn = false;
	jest.mocked(fireGlobalEvent).mockClear();
});

describe('useCustomScript', () => {
	it('should fire the logout event when nobody is logged in', () => {
		renderHook(() => useCustomScript(), { wrapper: mockAppRoot().build() });

		expect(firedEvents()).toEqual(['Custom_Script_Logged_Out']);
	});

	it('should fire only the login event when a stored session resumes on reload', () => {
		mockIsLoggingIn = true;

		const { rerender } = renderHook(() => useCustomScript(), { wrapper: mockAppRoot().build() });

		mockUserId = 'user-id';
		rerender();
		mockIsLoggingIn = false;
		rerender();

		expect(firedEvents()).toEqual(['Custom_Script_Logged_In']);
	});

	it('should fire the logout event when the resume fails', () => {
		mockIsLoggingIn = true;

		const { rerender } = renderHook(() => useCustomScript(), { wrapper: mockAppRoot().build() });

		mockIsLoggingIn = false;
		rerender();

		expect(firedEvents()).toEqual(['Custom_Script_Logged_Out']);
	});

	it('should not fire the login event again when a logged-in session logs in again after a reconnect', () => {
		mockUserId = 'user-id';

		const { rerender } = renderHook(() => useCustomScript(), { wrapper: mockAppRoot().build() });

		mockIsLoggingIn = true;
		rerender();
		mockIsLoggingIn = false;
		rerender();

		expect(firedEvents()).toEqual(['Custom_Script_Logged_In']);
	});

	it('should not fire the logout event again when a login attempt on the login page fails', () => {
		const { rerender } = renderHook(() => useCustomScript(), { wrapper: mockAppRoot().build() });

		mockIsLoggingIn = true;
		rerender();
		mockIsLoggingIn = false;
		rerender();

		expect(firedEvents()).toEqual(['Custom_Script_Logged_Out']);
	});

	it('should fire each event again on a later logout and login', () => {
		mockUserId = 'user-id';

		const { rerender } = renderHook(() => useCustomScript(), { wrapper: mockAppRoot().build() });

		mockUserId = undefined;
		rerender();
		mockUserId = 'user-id';
		rerender();

		expect(firedEvents()).toEqual(['Custom_Script_Logged_In', 'Custom_Script_Logged_Out', 'Custom_Script_Logged_In']);
	});
});
