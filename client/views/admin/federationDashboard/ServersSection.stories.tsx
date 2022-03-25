import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import ServersSection from './ServersSection';

export default {
	title: 'Admin/Federation Dashboard/ServersSection',
	component: ServersSection,
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof ServersSection>;

export const Default: ComponentStory<typeof ServersSection> = () => <ServersSection />;
Default.storyName = 'ServersSection';
