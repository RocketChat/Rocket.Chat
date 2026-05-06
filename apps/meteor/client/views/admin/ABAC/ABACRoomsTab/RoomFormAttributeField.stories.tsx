import { Field } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';
import { FormProvider, useForm } from 'react-hook-form';

import type { RoomFormData } from './RoomForm';
import RoomFormAttributeField from './RoomFormAttributeField';
import { createFakeLicenseInfo } from '../../../../../tests/mocks/data';

const mockAttributes = [
	{ _id: 'attr1', _updatedAt: new Date().toISOString(), key: 'Department', values: ['Engineering', 'Sales', 'Marketing'] },
	{ _id: 'attr2', _updatedAt: new Date().toISOString(), key: 'Security-Level', values: ['Public', 'Internal', 'Confidential'] },
	{ _id: 'attr3', _updatedAt: new Date().toISOString(), key: 'Location', values: ['US', 'EU', 'APAC'] },
];

const meta: Meta<typeof RoomFormAttributeField> = {
	component: RoomFormAttributeField,
	parameters: {
		layout: 'padded',
	},
	decorators: [
		(Story) => {
			const AppRoot = mockAppRoot()
				.withSetting('ABAC_Enabled', true, {
					packageValue: false,
					blocked: false,
					public: true,
					type: 'boolean',
					i18nLabel: 'ABAC_Enabled',
					i18nDescription: 'ABAC_Enabled_Description',
				})
				.withEndpoint('GET', '/v1/licenses.info', async () => ({
					license: createFakeLicenseInfo({ activeModules: ['abac'] }),
				}))
				.withEndpoint('GET', '/v1/abac/attributes', () => ({
					attributes: mockAttributes,
					offset: 0,
					count: mockAttributes.length,
					total: mockAttributes.length,
				}))
				.build();

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
		index: 0,
	},
};

export default meta;
type Story = StoryObj<typeof RoomFormAttributeField>;

export const Default: Story = {};
