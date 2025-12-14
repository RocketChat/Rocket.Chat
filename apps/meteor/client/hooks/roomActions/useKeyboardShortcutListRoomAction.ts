import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

const KeyboardShortcuts = lazy(() => import('../../views/room/contextualBar/KeyboardShortcuts'));

export const useKeyboardShortcutListRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'keyboard-shortcut-list',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			title: 'Keyboard_Shortcuts_Title',
			icon: 'keyboard',
			tabComponent: KeyboardShortcuts,
			order: 99,
			type: 'customization',
		}),
		[],
	);
};
