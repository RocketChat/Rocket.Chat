import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import SettingsGroupSelector from './SettingsGroupSelector';

export default {
	title: 'Admin/Settings/SettingsGroupSelector',
	component: SettingsGroupSelector,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof SettingsGroupSelector>;

export const Default: ComponentStory<typeof SettingsGroupSelector> = (args) => <SettingsGroupSelector {...args} />;
Default.storyName = 'GroupSelector';
