import { Field, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { GenericModal } from '@rocket.chat/ui-client';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import ModalForm from './ModalForm';

const meta = {
	component: ModalForm,
	decorators: [mockAppRoot().buildStoryDecorator()],
	parameters: {
		layout: 'centered',
	},
	render: () => (
		<GenericModal
			title='Rename'
			confirmText='Save'
			onCancel={action('onCancel')}
			wrapperFunction={(props) => (
				<ModalForm
					onSubmit={(event) => {
						event.preventDefault();
						action('onSubmit')(event);
					}}
					{...props}
				/>
			)}
		>
			<Field>
				<FieldLabel htmlFor='modal-form-name'>Name</FieldLabel>
				<FieldRow>
					<TextInput id='modal-form-name' />
				</FieldRow>
			</Field>
		</GenericModal>
	),
} satisfies Meta<typeof ModalForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		onSubmit: action('onSubmit'),
	},
};
