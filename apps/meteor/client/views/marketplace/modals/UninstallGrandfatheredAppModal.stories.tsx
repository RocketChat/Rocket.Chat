import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import UninstallGrandfatheredAppModal from './UninstallGrandfatheredAppModal';
import { createFakeApp } from '../../../../tests/mocks/data';

export default {
	title: 'Marketplace/modals/UninstallGrandfatheredAppModal',
	component: UninstallGrandfatheredAppModal,
	args: {
		app: createFakeApp(),
		onClose: fn(),
	},
	parameters: {
		layout: 'centered',
	},
	decorators: [
		mockAppRoot()
			.withDefaultTranslations()
			.withEndpoint('DELETE', '/apps/:id', () => ({
				app: createFakeApp(),
				success: true,
			}))
			.buildStoryDecorator(),
	],
} satisfies Meta<typeof UninstallGrandfatheredAppModal>;

export const Default: StoryObj<typeof UninstallGrandfatheredAppModal> = {};
