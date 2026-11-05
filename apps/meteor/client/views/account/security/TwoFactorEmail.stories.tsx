import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Decorator, Meta, StoryObj } from '@storybook/react';

import TwoFactorEmail from './TwoFactorEmail';

const renderIn =
	(enabled: boolean): Decorator =>
	(Story) => {
		const AppRoot = mockAppRoot()
			.withJohnDoe({ services: { email2fa: { enabled, changedAt: new Date() } } })
			.withEndpoint('POST', '/v1/users.2fa.enableEmail', () => null)
			.withEndpoint('POST', '/v1/users.2fa.disableEmail', () => null)
			.withTranslations('en', 'core', {
				'Two-factor_authentication_email': 'Two-factor authentication via email',
				'Two-factor_authentication_enabled': 'Two-factor authentication enabled',
				'Two-factor_authentication_disabled': 'Two-factor authentication disabled',
			})
			.build();
		return (
			<AppRoot>
				<div style={{ maxWidth: 600 }}>
					<Story />
				</div>
			</AppRoot>
		);
	};

export default {
	component: TwoFactorEmail,
	parameters: {
		layout: 'padded',
	},
} satisfies Meta<typeof TwoFactorEmail>;

type Story = StoryObj<typeof TwoFactorEmail>;

export const Disabled: Story = {
	decorators: [renderIn(false)],
};

export const Enabled: Story = {
	decorators: [renderIn(true)],
};
