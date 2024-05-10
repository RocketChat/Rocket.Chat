import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import GroupSelector from './GroupSelector';

export default {
	title: 'Admin/Settings/GroupSelector',
	component: GroupSelector,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof GroupSelector>;

export const Default: ComponentStory<typeof GroupSelector> = (args) => <GroupSelector {...args} />;
Default.storyName = 'GroupSelector';
