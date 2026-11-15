import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import { ResetPassphrase } from './ResetPassphrase';

export default {
	component: ResetPassphrase,
	parameters: {
		layout: 'padded',
	},
	decorators: [
		(Story) => {
			const AppRoot = mockAppRoot().build();
			return (
				<AppRoot>
					<div style={{ maxWidth: 600 }}>
						<Story />
					</div>
				</AppRoot>
			);
		},
	],
} satisfies Meta<typeof ResetPassphrase>;

type Story = StoryObj<typeof ResetPassphrase>;

export const Default: Story = {};
