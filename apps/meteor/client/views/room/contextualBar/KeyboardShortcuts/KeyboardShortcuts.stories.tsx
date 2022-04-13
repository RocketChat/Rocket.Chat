import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import KeyboardShortcutsWithClose from './KeyboardShortcutsWithClose';

export default {
	title: 'Room/Contextual Bar/KeyboardShortcut',
	component: KeyboardShortcutsWithClose,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <VerticalBar height='100vh'>{fn()}</VerticalBar>],
} as ComponentMeta<typeof KeyboardShortcutsWithClose>;

export const Default: ComponentStory<typeof KeyboardShortcutsWithClose> = (args) => <KeyboardShortcutsWithClose {...args} />;
Default.storyName = 'KeyboardShortcuts';
