import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import DeleteConferenceLinkModal from './DeleteConferenceLinkModal';

const PHONE_VIEWPORTS = {
	phone: { name: 'Phone', styles: { width: '375px', height: '812px' } },
} as const;

const meta = {
	component: DeleteConferenceLinkModal,
	parameters: { layout: 'fullscreen' },
	args: {
		linkTitle: 'Weekly sync',
		onConfirm: action('onConfirm'),
		onClose: action('onClose'),
	},
} satisfies Meta<typeof DeleteConferenceLinkModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongTitle: Story = {
	args: { linkTitle: 'Quarterly-planning-for-the-platform-and-infrastructure-teams-with-every-stakeholder-invited' },
};

export const Pending: Story = {
	args: { isPending: true },
};

export const OnPhone: Story = {
	parameters: { viewport: { options: PHONE_VIEWPORTS } },
	globals: { viewport: { value: 'phone', isRotated: false } },
};
