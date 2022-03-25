import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import OverviewSection from './OverviewSection';

export default {
	title: 'Admin/Federation Dashboard/OverviewSection',
	component: OverviewSection,
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof OverviewSection>;

export const Default: ComponentStory<typeof OverviewSection> = () => <OverviewSection />;
Default.storyName = 'OverviewSection';
