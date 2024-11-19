import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import DisableAppModal from './DisableAppModal';
import { createFakeApp } from '../../../../tests/mocks/data';

export default {
	title: 'Marketplace/modals/DisableAppModal',
	component: DisableAppModal,
	args: {
		onClose: fn(),
	},
	parameters: {
		layout: 'centered',
	},
	decorators: [
		mockAppRoot()
			.withDefaultTranslations()
			.withEndpoint('POST', '/apps/:id/status', ({ status }) => ({ status }))
			.buildStoryDecorator(),
	],
} satisfies Meta<typeof DisableAppModal>;

export const Default: StoryObj<typeof DisableAppModal> = {
	args: {
		app: createFakeApp(),
	},
};
