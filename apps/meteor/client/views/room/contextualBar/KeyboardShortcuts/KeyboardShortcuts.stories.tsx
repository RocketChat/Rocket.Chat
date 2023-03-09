import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import KeyboardShortcutsWithData from './KeyboardShortcutsWithData';

export default {
	title: 'Room/Contextual Bar/KeyboardShortcut',
	component: KeyboardShortcutsWithData,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <VerticalBar height='100vh'>{fn()}</VerticalBar>],
} as ComponentMeta<typeof KeyboardShortcutsWithData>;

export const Default: ComponentStory<typeof KeyboardShortcutsWithData> = (args) => <KeyboardShortcutsWithData {...args} />;
Default.storyName = 'KeyboardShortcuts';
