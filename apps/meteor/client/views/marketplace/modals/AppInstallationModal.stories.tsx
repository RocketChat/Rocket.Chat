import type { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import AppInstallationModal from './AppInstallationModal';

export default {
	title: 'Marketplace/components/AppInstallationModal',
	component: AppInstallationModal,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof AppInstallationModal>;

const Template: StoryFn<typeof AppInstallationModal> = (args) => <AppInstallationModal {...args} />;

export const Default = Template.bind({});
Default.storyName = 'AppInstallationModal';
Default.args = {
	appName: 'Example-app-name',
};
