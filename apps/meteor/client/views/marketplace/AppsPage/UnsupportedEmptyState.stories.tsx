import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import UnsupportedEmptyState from './UnsupportedEmptyState';

export default {
	title: 'Marketplace/Components/UnsupportedEmptyState',
	component: UnsupportedEmptyState,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof UnsupportedEmptyState>;

export const Default: ComponentStory<typeof UnsupportedEmptyState> = () => <UnsupportedEmptyState />;
Default.storyName = 'UnsupportedEmptyState';
