import { Callout } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import type { Meta, StoryObj } from '@storybook/react';

import ModalCalloutContent from './ModalCalloutContent';

const meta = {
	component: ModalCalloutContent,
	decorators: [
		(Story) => (
			<GenericModal
				variant='warning'
				title='Save changes?'
				onConfirm={() => undefined}
				onCancel={() => undefined}
				onClose={() => undefined}
			>
				<Story />
			</GenericModal>
		),
	],
	args: {
		children: <Callout type='warning'>Saving removes the room attributes.</Callout>,
	},
} satisfies Meta<typeof ModalCalloutContent>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
