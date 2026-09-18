import { Field } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta } from '@storybook/react';
import { action } from 'storybook/actions';

import MultiLookupSettingInput from './MultiLookupSettingInput';

const LOOKUP_ENDPOINT = '/v1/abac/attribute-keys' as const;

const options = ['clearance', 'nationality', 'project', 'releasability'].map((key) => ({ key, label: key }));

const meta = {
	component: MultiLookupSettingInput,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	args: {
		_id: 'setting_id',
		label: 'Label',
		placeholder: 'Placeholder',
		packageValue: [],
		disabled: false,
		hasResetButton: false,
		lookupEndpoint: LOOKUP_ENDPOINT,
	},
	decorators: [
		(Story) => {
			const AppRoot = mockAppRoot()
				.withEndpoint('GET', LOOKUP_ENDPOINT, () => ({ data: options }))
				.build();

			return (
				<AppRoot>
					<Field>
						<Story />
					</Field>
				</AppRoot>
			);
		},
	],
} satisfies Meta<typeof MultiLookupSettingInput>;

export default meta;

export const Default = {};

export const WithValue = {
	args: {
		value: ['clearance', 'project'],
	},
};

export const WithValueMissingFromOptions = {
	args: {
		value: ['clearance', 'decommissioned_key'],
	},
};

export const Disabled = {
	args: {
		value: ['clearance'],
		disabled: true,
	},
};

export const WithResetButton = {
	args: {
		value: ['clearance'],
		hasResetButton: true,
		onResetButtonClick: action('onResetButtonClick'),
	},
};
