import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { ContextualbarContainer } from '../../../../components/Contextualbar';
import KeyboardShortcutsWithData from './KeyboardShortcutsWithData';

export default {
	title: 'Room/Contextual Bar/KeyboardShortcut',
	component: KeyboardShortcutsWithData,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <ContextualbarContainer height='100vh'>{fn()}</ContextualbarContainer>],
} as ComponentMeta<typeof KeyboardShortcutsWithData>;

export const Default: ComponentStory<typeof KeyboardShortcutsWithData> = (args) => <KeyboardShortcutsWithData {...args} />;
Default.storyName = 'KeyboardShortcuts';
