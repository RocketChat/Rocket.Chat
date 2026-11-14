import { Page } from '@rocket.chat/ui-client';
import type { Meta, StoryObj } from '@storybook/react';

import AppSecurity from './AppSecurity';

export default {
	component: AppSecurity,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(Story) => (
			<Page>
				<Story />
			</Page>
		),
	],
} satisfies Meta<typeof AppSecurity>;

type Story = StoryObj<typeof AppSecurity>;

export const Default: Story = {
	args: {
		privacyPolicySummary: 'The app reads the messages of the rooms it is added to and sends a copy to the vendor to build usage reports.',
		appPermissions: [
			{ name: 'message.read', required: true },
			{ name: 'room.read', required: true },
			{ name: 'user.read' },
			{ name: 'networking' },
		],
		tosLink: 'https://example.com/terms',
		privacyLink: 'https://example.com/privacy',
	},
};

export const WithoutLinks: Story = {
	args: {
		privacyPolicySummary: 'The app does not store any data.',
		appPermissions: [{ name: 'message.read', required: true }],
	},
};
