import { lazy, useEffect } from 'react';

import { ui } from '../../lib/ui';

const KeyboardShortcuts = lazy(() => import('../../views/room/contextualBar/KeyboardShortcuts'));

export const useKeyboardShortcutListRoomAction = () => {
	useEffect(() => {
		return ui.addRoomAction('keyboard-shortcut-list', {
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			id: 'keyboard-shortcut-list',
			title: 'Keyboard_Shortcuts_Title',
			icon: 'keyboard',
			template: KeyboardShortcuts,
			order: 99,
		});
	}, []);
};
