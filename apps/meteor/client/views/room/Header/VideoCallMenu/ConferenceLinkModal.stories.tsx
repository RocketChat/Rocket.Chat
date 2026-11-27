import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';
import { userEvent, within } from 'storybook/test';

import ConferenceLinkModal from './ConferenceLinkModal';

const PHONE_VIEWPORTS = {
	phone: { name: 'Phone', styles: { width: '375px', height: '812px' } },
} as const;

const meta = {
	component: ConferenceLinkModal,
	parameters: { layout: 'fullscreen' },
	args: {
		mode: 'create',
		onConfirm: action('onConfirm'),
		onClose: action('onClose'),
	},
} satisfies Meta<typeof ConferenceLinkModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Create: Story = {};

/** Renaming changes the link's address, so the field says so. */
export const Rename: Story = {
	args: { mode: 'rename', initialTitle: 'Weekly sync' },
};

export const RequiredError: Story = {
	play: async ({ canvasElement }) => {
		await userEvent.click(await within(canvasElement).findByRole('button', { name: /create/i }));
	},
};

export const Pending: Story = {
	args: { mode: 'rename', initialTitle: 'Weekly sync', isPending: true },
};

/** A title the server refused, handed back by the caller already translated. */
export const ServerError: Story = {
	args: { initialTitle: '!!!', error: 'The name must contain letters or numbers' },
};

export const LongTitle: Story = {
	args: { mode: 'rename', initialTitle: 'Quarterly-planning-for-the-platform-and-infrastructure-teams-with-every-stakeholder-invited' },
};

export const OnPhone: Story = {
	args: { mode: 'rename', initialTitle: 'Weekly sync' },
	parameters: { viewport: { options: PHONE_VIEWPORTS } },
	globals: { viewport: { value: 'phone', isRotated: false } },
};
