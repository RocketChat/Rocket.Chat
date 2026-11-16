import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Decorator, Meta, StoryObj } from '@storybook/react';

import TwoFactorTOTP from './TwoFactorTOTP';

const renderIn =
	(enabled: boolean): Decorator =>
	(Story) => {
		const AppRoot = mockAppRoot()
			.withJohnDoe({ services: { totp: { enabled, hashedBackup: [], secret: 'secret' } } })
			.withEndpoint('GET', '/v1/users.totpCodesRemaining', () => ({ remaining: 7 }))
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
	component: TwoFactorTOTP,
	parameters: {
		layout: 'padded',
	},
} satisfies Meta<typeof TwoFactorTOTP>;

type Story = StoryObj<typeof TwoFactorTOTP>;

export const Disabled: Story = {
	decorators: [renderIn(false)],
};

export const Enabled: Story = {
	decorators: [renderIn(true)],
};
