import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { usePreferences } from './usePreferences';

const sendTestNotification = () => undefined;

it('exposes saved preferences and the settings that shape the notifications section', () => {
	const { result } = renderHook(() => usePreferences({ sendTestNotification }), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withUserPreference('highlights', ['foo', 'bar'])
			.withSetting('Accounts_Default_User_Preferences_desktopNotifications', 'mentions')
			.withSetting('Device_Management_Enable_Login_Emails', true)
			.withSetting('Device_Management_Allow_Login_Email_preference', false)
			.withSetting('VoIP_TeamCollab_Mobile_Ringing_Enabled', true)
			.build(),
	});

	expect(result.current.values.highlights).toBe('foo,\nbar');
	expect(result.current.notifications).toMatchObject({
		defaultDesktop: 'mentions',
		showNewLoginEmailPreference: false,
		showMobileRinging: true,
	});
});

it('saves the converted payload', async () => {
	const setPreferences = jest.fn(() => ({ user: {} }));
	const dispatchToast = jest.fn();
	const { result } = renderHook(() => usePreferences({ sendTestNotification }), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withEndpoint('POST', '/v1/users.setPreferences', setPreferences as never)
			.withToastMessageDispatch(dispatchToast)
			.build(),
	});

	await act(() => result.current.save({ highlights: 'a, b' }));

	expect(setPreferences).toHaveBeenCalledWith({ data: { highlights: ['a', 'b'] } });
	expect(dispatchToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
});

it.each([
	[
		{ requested: true, pendingOperationsBeforeMyRequest: 2 },
		{ type: 'requested', pendingOperations: 2 },
	],
	[
		{ requested: false, pendingOperationsBeforeMyRequest: 0, exportOperation: { status: 'completed' }, url: 'https://x/file.zip' },
		{ type: 'completed', url: 'https://x/file.zip' },
	],
	[
		{ requested: false, pendingOperationsBeforeMyRequest: 3, exportOperation: { status: 'pending' } },
		{ type: 'already-requested', pendingOperations: 3 },
	],
	[{ requested: false, pendingOperationsBeforeMyRequest: 0 }, { type: 'acknowledged' }],
])('maps a data download response to its dialog', async (response, dialog) => {
	const { result } = renderHook(() => usePreferences({ sendTestNotification }), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withEndpoint('GET', '/v1/users.requestDataDownload', (() => response) as never)
			.build(),
	});

	await act(() => result.current.requestDataDownload(false));
	expect(result.current.dataDownloadDialog).toEqual(dialog);

	act(() => result.current.dismissDataDownloadDialog());
	expect(result.current.dataDownloadDialog).toBeNull();
});
