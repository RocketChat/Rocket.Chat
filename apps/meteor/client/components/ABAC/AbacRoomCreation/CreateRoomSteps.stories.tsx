import { Field, FieldGroup, FieldLabel, FieldRow, Modal, ModalHeader, ModalTitle, TextInput } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';
import { userEvent, within } from 'storybook/test';

import CreateRoomSteps from './CreateRoomSteps';
import type { useAbacCreationFlow } from './useAbacCreationFlow';

const flow = {
	step: 'details',
	index: 0,
	total: 2,
	back: () => undefined,
	isStepBlocked: false,
	assignable: { data: undefined, isPending: false, error: null },
	preview: { data: undefined, isPending: false, isError: false, error: null },
} as unknown as ReturnType<typeof useAbacCreationFlow>;

const details = (
	<FieldGroup>
		{['Name', 'Topic', 'Description'].map((label) => (
			<Field key={label}>
				<FieldLabel>{label}</FieldLabel>
				<FieldRow>
					<TextInput placeholder={label} />
				</FieldRow>
			</Field>
		))}
	</FieldGroup>
);

export default {
	component: CreateRoomSteps,
	decorators: [
		(Story) => {
			const AppRoot = mockAppRoot().build();
			return (
				<AppRoot>
					<Modal>
						<ModalHeader>
							<ModalTitle>Create channel</ModalTitle>
						</ModalHeader>
						<Story />
					</Modal>
				</AppRoot>
			);
		},
	],
	args: {
		flow,
		details,
		security: null,
		onCancel: action('onCancel'),
		submitDisabled: false,
		isSubmitting: false,
	},
} satisfies Meta<typeof CreateRoomSteps>;

type Story = StoryObj<typeof CreateRoomSteps>;

export const Details: Story = {};

export const WithLastFieldFocused: Story = {
	play: async ({ canvasElement }) => {
		await userEvent.click(within(canvasElement.ownerDocument.body).getByPlaceholderText('Description'));
	},
};
