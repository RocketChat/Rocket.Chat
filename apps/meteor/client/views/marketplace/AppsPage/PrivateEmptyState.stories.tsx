import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import PrivateEmptyState from './PrivateEmptyState';

export default {
	title: 'Marketplace/Components/PageEmptyPrivateApps',
	component: PrivateEmptyState,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof PrivateEmptyState>;

export const Default: ComponentStory<typeof PrivateEmptyState> = () => <PrivateEmptyState />;
Default.storyName = 'PageEmptyPrivateApps';
