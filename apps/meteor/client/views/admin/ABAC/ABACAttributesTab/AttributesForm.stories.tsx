import { Contextualbar } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { FormProvider, useForm } from 'react-hook-form';

import AttributesForm, { type AttributesFormFormData } from './AttributesForm';

export default {
	component: AttributesForm,
	parameters: {
		layout: 'padded',
	},
	args: {
		description: 'Create an attribute that can later be assigned to rooms.',
	},
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				Name: 'Name',
				Values: 'Values',
				Add_Value: 'Add Value',
				Cancel: 'Cancel',
				Save: 'Save',
				Required_field: '{{field}} is required',
			})
			.buildStoryDecorator(),
	],
} satisfies Meta<typeof AttributesForm>;

export const NewAttribute: StoryObj<typeof AttributesForm> = {
	decorators: [
		(fn) => {
			const methods = useForm<AttributesFormFormData>({
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
	],
};

export const WithLockedAttributes: StoryObj<typeof AttributesForm> = {
	args: {
		description: 'Attribute values cannot be edited, but can be added or deleted.',
	},

	decorators: [
		(fn) => {
			const methods = useForm<AttributesFormFormData>({
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
	],
};
