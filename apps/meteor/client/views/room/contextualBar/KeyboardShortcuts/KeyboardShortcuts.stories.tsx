import type { Meta, StoryFn } from '@storybook/react';

import KeyboardShortcutsWithData from './KeyboardShortcutsWithData';
import { Contextualbar } from '../../../../components/Contextualbar';

export default {
	title: 'Room/Contextual Bar/KeyboardShortcut',
	component: KeyboardShortcutsWithData,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
} satisfies Meta<typeof KeyboardShortcutsWithData>;

export const Default: StoryFn<typeof KeyboardShortcutsWithData> = () => <KeyboardShortcutsWithData />;
Default.storyName = 'KeyboardShortcuts';
