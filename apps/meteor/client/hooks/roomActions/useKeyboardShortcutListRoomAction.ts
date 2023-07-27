import { lazy, useMemo } from 'react';

import type { ToolboxActionConfig } from '../../views/room/lib/Toolbox';

const KeyboardShortcuts = lazy(() => import('../../views/room/contextualBar/KeyboardShortcuts'));

export const useKeyboardShortcutListRoomAction = (): ToolboxActionConfig => {
	return useMemo(
		() => ({
			id: 'keyboard-shortcut-list',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			title: 'Keyboard_Shortcuts_Title',
			icon: 'keyboard',
			template: KeyboardShortcuts,
			order: 99,
		}),
		[],
	);
};
