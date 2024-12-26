import type { Meta, StoryFn } from '@storybook/react';

import AppInstallModal from './AppInstallModal';

export default {
	title: 'Marketplace/components/AppInstallModal',
	component: AppInstallModal,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof AppInstallModal>;

const Template: StoryFn<typeof AppInstallModal> = (args) => <AppInstallModal {...args} />;

export const Default = Template.bind({});
Default.storyName = 'AppInstallModal';
Default.args = {
	enabled: 1,
	limit: 3,
	appName: 'Example-app-name',
};
