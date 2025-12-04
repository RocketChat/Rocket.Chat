import { Field } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';
import { FormProvider, useForm } from 'react-hook-form';

import ABACAttributeField from './ABACAttributeField';
import type { AdminABACRoomFormData } from './AdminABACRoomForm';

const mockAttribute1 = {
	_id: 'attr1',
	_updatedAt: new Date().toISOString(),
	key: 'Department',
	values: ['Engineering', 'Sales', 'Marketing'],
};

const mockAttribute2 = {
	_id: 'attr2',
	_updatedAt: new Date().toISOString(),
	key: 'Security-Level',
	values: ['Public', 'Internal', 'Confidential'],
};

const mockAttribute3 = {
	_id: 'attr3',
	_updatedAt: new Date().toISOString(),
	key: 'Location',
	values: ['US', 'EU', 'APAC'],
};

const meta: Meta<typeof ABACAttributeField> = {
	component: ABACAttributeField,
	parameters: {
		layout: 'padded',
	},
	decorators: [
		(Story) => {
			const AppRoot = mockAppRoot()
				.withEndpoint('GET', '/v1/abac/attributes', () => ({
					attributes: [mockAttribute1, mockAttribute2, mockAttribute3],
					count: 3,
					offset: 0,
					total: 3,
				}))
				.build();

			const methods = useForm<AdminABACRoomFormData>({
				defaultValues: {
					room: '',
					attributes: [{ key: '', values: [] }],
				},
				mode: 'onChange',
			});

			return (
				<AppRoot>
					<FormProvider {...methods}>
						<Field>
							<Story />
						</Field>
					</FormProvider>
				</AppRoot>
			);
		},
	],
	args: {
		onRemove: action('onRemove'),
		index: 0,
	},
};

export default meta;
type Story = StoryObj<typeof ABACAttributeField>;

export const Default: Story = {};
