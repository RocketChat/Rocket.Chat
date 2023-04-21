import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import AppInstallModal from './AppInstallModal';

export default {
	title: 'Marketplace/components/AppInstallModal',
	component: AppInstallModal,
	parameters: {
		layout: 'centered',
	},
} as ComponentMeta<typeof AppInstallModal>;

const Template: ComponentStory<typeof AppInstallModal> = (args) => <AppInstallModal {...args} />;

export const Default = Template.bind({});
Default.storyName = 'AppInstallModal';
Default.args = {
	enabled: 1,
	limit: 3,
	appName: 'Example-app-name',
};
