import { Field } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';
import { FormProvider, useForm } from 'react-hook-form';

import type { RoomFormData } from './RoomForm';
import RoomFormAttributeField from './RoomFormAttributeField';

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

const meta: Meta<typeof RoomFormAttributeField> = {
	component: RoomFormAttributeField,
	parameters: {
		layout: 'padded',
	},
	decorators: [
		(Story) => {
			const AppRoot = mockAppRoot().build();

			const methods = useForm<RoomFormData>({
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
		attributeList: [
			{ value: mockAttribute1.key, label: mockAttribute1.key, attributeValues: mockAttribute1.values },
			{ value: mockAttribute2.key, label: mockAttribute2.key, attributeValues: mockAttribute2.values },
			{ value: mockAttribute3.key, label: mockAttribute3.key, attributeValues: mockAttribute3.values },
		],
		index: 0,
	},
};

export default meta;
type Story = StoryObj<typeof RoomFormAttributeField>;

export const Default: Story = {};
