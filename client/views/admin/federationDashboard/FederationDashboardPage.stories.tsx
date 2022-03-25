import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import FederationDashboardPage from './FederationDashboardPage';

export default {
	title: 'Community/Views/Admin/Federation Dashboard/FederationDashboardPage',
	component: FederationDashboardPage,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof FederationDashboardPage>;

export const Default: ComponentStory<typeof FederationDashboardPage> = () => <FederationDashboardPage />;
Default.storyName = 'FederationDashboardPage';
