import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import { ResetPassphrase } from './ResetPassphrase';

export default {
	component: ResetPassphrase,
	decorators: [
		mockAppRoot()
			.withJohnDoe()
			.withEndpoint('POST', '/v1/users.resetE2EKey', () => null)
			.withTranslations('en', 'core', {
				Reset_E2EE_password: 'Reset E2EE password',
				Reset_E2EE_password_description: 'Reset the key only if you cannot recover your E2EE password.',
				Reset: 'Reset',
				Cancel: 'Cancel',
				Close: 'Close',
				Are_you_sure: 'Are you sure?',
			})
			.buildStoryDecorator(),
	],
} satisfies Meta<typeof ResetPassphrase>;

export const Default: StoryObj<typeof ResetPassphrase> = {};
