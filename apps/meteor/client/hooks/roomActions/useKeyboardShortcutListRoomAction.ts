import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const KeyboardShortcuts = lazy(() => import('../../views/room/contextualBar/KeyboardShortcuts'));

export const useKeyboardShortcutListRoomAction = () => {
	const enabled = useSetting('Menu_Keyboard_Shortcut_List', true);

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!enabled) {
			return undefined;
		}
		return {
			id: 'keyboard-shortcut-list',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			title: 'Keyboard_Shortcuts_Title',
			icon: 'keyboard',
			tabComponent: KeyboardShortcuts,
			order: 99,
		};
	}, [enabled]);
};
