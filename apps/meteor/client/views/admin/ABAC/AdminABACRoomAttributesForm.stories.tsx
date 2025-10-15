import { Contextualbar } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';
import type { ComponentProps } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import AdminABACRoomAttributesForm, { type AdminABACRoomAttributesFormFormData } from './AdminABACRoomAttributesForm';

export default {
	component: AdminABACRoomAttributesForm,
	parameters: {
		layout: 'padded',
	},
	args: {
		description: 'Create an attribute that can later be assigned to rooms.',
	},
	decorators: [mockAppRoot().buildStoryDecorator()],
} satisfies Meta<typeof AdminABACRoomAttributesForm>;

export const Default: StoryFn<ComponentProps<typeof AdminABACRoomAttributesForm>> = (args) => (
	<AdminABACRoomAttributesForm onSave={action('onSave')} onCancel={action('onCancel')} description={args.description} />
);

Default.decorators = [
	(fn) => {
		const methods = useForm<AdminABACRoomAttributesFormFormData>({
			defaultValues: {
				name: '',
				attributeValues: [{ value: '' }],
				lockedAttributes: [],
			},
			mode: 'onChange',
		});

		return (
			<FormProvider {...methods}>
				<Contextualbar width='400px' p={16}>
					{fn()}
				</Contextualbar>
			</FormProvider>
		);
	},
];

export const WithLockedAttributes: StoryFn<ComponentProps<typeof AdminABACRoomAttributesForm>> = (args) => (
	<AdminABACRoomAttributesForm onSave={action('onSave')} onCancel={action('onCancel')} description={args.description} />
);
WithLockedAttributes.args = {
	description: 'Attribute values cannot be edited, but can be added or deleted.',
};

WithLockedAttributes.decorators = [
	(fn) => {
		const methods = useForm<AdminABACRoomAttributesFormFormData>({
			defaultValues: {
				name: 'Room Type',
				lockedAttributes: [{ value: 'Locked Value 1' }, { value: 'Locked Value 2' }, { value: 'Locked Value 3' }],
			},
			mode: 'onChange',
		});

		return (
			<FormProvider {...methods}>
				<Contextualbar width='400px' p={16}>
					{fn()}
				</Contextualbar>
			</FormProvider>
		);
	},
];
