import { ExternalLink } from '@rocket.chat/ui-client';
import type { Meta, StoryObj } from '@storybook/react';

import VersionCardActionItem from './VersionCardActionItem';

export default {
	component: VersionCardActionItem,
	parameters: {
		layout: 'padded',
	},
	args: {
		icon: 'check',
		label: 'Operating within plan limits',
	},
} satisfies Meta<typeof VersionCardActionItem>;

type Story = StoryObj<typeof VersionCardActionItem>;

export const Default: Story = {};

export const Danger: Story = {
	args: { danger: true, icon: 'warning', label: 'Plan limits reached' },
};

export const WithLink: Story = {
	args: {
		label: (
			<>
				Version <ExternalLink to='https://go.rocket.chat/i/version-support'>supported</ExternalLink> until Dec 31, 2026
			</>
		),
	},
};
