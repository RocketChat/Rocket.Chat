import { Contextualbar } from '@rocket.chat/ui-client';
import type { Meta, StoryFn } from '@storybook/react';

import KeyboardShortcutsWithData from './KeyboardShortcutsWithData';

export default {
	component: KeyboardShortcutsWithData,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
} satisfies Meta<typeof KeyboardShortcutsWithData>;

export const Default: StoryFn<typeof KeyboardShortcutsWithData> = () => <KeyboardShortcutsWithData />;
Default.storyName = 'KeyboardShortcuts';
