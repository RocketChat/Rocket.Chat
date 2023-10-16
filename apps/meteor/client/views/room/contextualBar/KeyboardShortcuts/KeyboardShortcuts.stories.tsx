import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { Contextualbar } from '../../../../components/Contextualbar';
import KeyboardShortcutsWithData from './KeyboardShortcutsWithData';

export default {
	title: 'Room/Contextual Bar/KeyboardShortcut',
	component: KeyboardShortcutsWithData,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
} as ComponentMeta<typeof KeyboardShortcutsWithData>;

export const Default: ComponentStory<typeof KeyboardShortcutsWithData> = () => <KeyboardShortcutsWithData />;
Default.storyName = 'KeyboardShortcuts';
