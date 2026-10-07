import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useViewModeItems } from './useViewModeItems';

it('offers the two view modes, the avatar submenu and the message preview', () => {
	const { result } = renderHook(() => useViewModeItems());

	expect(result.current.map(({ id }) => id)).toEqual(['extended', 'condensed', 'avatars', 'message-preview']);
});

describe('Avatars', () => {
	const getAvatarSubmenu = (items: ReturnType<typeof useViewModeItems>) => items.find((item) => item.id === 'avatars')?.submenu;

	it('lists Off and the three sizes', () => {
		const { result } = renderHook(() => useViewModeItems());

		expect(getAvatarSubmenu(result.current)?.map(({ id }) => id)).toEqual(['avatar-off', 'avatar-small', 'avatar-medium', 'avatar-large']);
	});

	it('checks the current size', () => {
		const { result } = renderHook(() => useViewModeItems(), {
			wrapper: mockAppRoot().withUserPreference('sidebarDisplayAvatar', true).withUserPreference('sidebarAvatarSize', 'large').build(),
		});

		const checked = getAvatarSubmenu(result.current)?.filter(({ addon }) => addon);
		expect(checked?.map(({ id }) => id)).toEqual(['avatar-large']);
	});

	it('checks Off when avatars are hidden, whatever the size', () => {
		const { result } = renderHook(() => useViewModeItems(), {
			wrapper: mockAppRoot().withUserPreference('sidebarDisplayAvatar', false).withUserPreference('sidebarAvatarSize', 'large').build(),
		});

		const checked = getAvatarSubmenu(result.current)?.filter(({ addon }) => addon);
		expect(checked?.map(({ id }) => id)).toEqual(['avatar-off']);
	});
});

describe('Message preview', () => {
	const getPreviewItem = (items: ReturnType<typeof useViewModeItems>) => items.find((item) => item.id === 'message-preview');

	it('is offered and enabled when the workspace stores last messages', () => {
		const { result } = renderHook(() => useViewModeItems(), {
			wrapper: mockAppRoot().withSetting('Store_Last_Message', true).withUserPreference('sidebarDisplayPreview', true).build(),
		});

		expect(getPreviewItem(result.current)).toEqual(expect.objectContaining({ disabled: false, textValue: 'Message_preview' }));
	});

	it('is disabled, with an explanation, when the workspace does not store last messages', () => {
		const { result } = renderHook(() => useViewModeItems(), {
			wrapper: mockAppRoot().withSetting('Store_Last_Message', false).withUserPreference('sidebarDisplayPreview', true).build(),
		});

		expect(getPreviewItem(result.current)).toEqual(
			expect.objectContaining({ disabled: true, tooltip: 'Message_preview_unavailable_description' }),
		);
	});
});
