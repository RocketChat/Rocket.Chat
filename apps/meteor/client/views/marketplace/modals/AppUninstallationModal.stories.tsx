import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import AppUninstallationModal from './AppUninstallationModal';
import { createFakeApp } from '../../../../tests/mocks/data';

export default {
	title: 'Marketplace/modals/AppUninstallationModal',
	component: AppUninstallationModal,
	args: {
		onClose: fn(),
	},
	parameters: {
		layout: 'centered',
	},
	decorators: [
		mockAppRoot()
			.withDefaultTranslations()
			.withEndpoint('DELETE', '/apps/:id', () => ({
				success: true,
				app: createFakeApp(),
			}))
			.buildStoryDecorator(),
	],
} satisfies Meta<typeof AppUninstallationModal>;

export const Default: StoryObj<typeof AppUninstallationModal> = {
	args: {
		app: createFakeApp(),
	},
};
