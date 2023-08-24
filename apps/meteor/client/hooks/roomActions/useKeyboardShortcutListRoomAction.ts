import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

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
