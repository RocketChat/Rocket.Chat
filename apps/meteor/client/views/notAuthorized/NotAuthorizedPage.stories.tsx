import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import NotAuthorizedPage from './NotAuthorizedPage';

export default {
	title: 'Not Authorized/NotAuthorizedPage',
	component: NotAuthorizedPage,
	parameters: {
		layout: 'fullscreen',
	},
} as ComponentMeta<typeof NotAuthorizedPage>;

export const Default: ComponentStory<typeof NotAuthorizedPage> = () => <NotAuthorizedPage />;
Default.storyName = 'NotAuthorizedPage';
