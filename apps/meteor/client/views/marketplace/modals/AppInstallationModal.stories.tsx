import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import AppInstallationModal from './AppInstallationModal';

export default {
	title: 'Marketplace/modals/AppInstallationModal',
	component: AppInstallationModal,
	args: {
		onInstall: fn(),
		onClose: fn(),
	},
	parameters: {
		layout: 'centered',
	},
	decorators: [
		mockAppRoot()
			.withEndpoint('GET', '/apps/count', () => ({
				maxMarketplaceApps: 50,
				installedApps: 25,
				maxPrivateApps: 5,
				totalMarketplaceEnabled: 24,
				totalPrivateEnabled: 3,
			}))
			.withDefaultTranslations()
			.buildStoryDecorator(),
	],
} satisfies Meta<typeof AppInstallationModal>;

export const Default: StoryObj<typeof AppInstallationModal> = {
	args: {
		appName: 'Example-app-name',
	},
};
