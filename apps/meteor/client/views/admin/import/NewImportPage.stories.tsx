import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import NewImportPage from './NewImportPage';

export default {
	title: 'Admin/Import/NewImportPage',
	component: NewImportPage,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof NewImportPage>;

export const Default: ComponentStory<typeof NewImportPage> = () => <NewImportPage />;
Default.storyName = 'NewImportPage';
