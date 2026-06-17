import { Field } from '@rocket.chat/fuselage';
import type { Meta } from '@storybook/react';

import StringSettingInput from './StringSettingInput';

export default {
	component: StringSettingInput,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	decorators: [(fn) => <Field>{fn()}</Field>],
} satisfies Meta<typeof StringSettingInput>;

export const Default = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		placeholder: 'Placeholder',
	},
};

export const Disabled = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		placeholder: 'Placeholder',
		disabled: true,
	},
};

export const WithValue = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		value: 'Value',
		placeholder: 'Placeholder',
	},
};

export const Multiline = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		value: 'Value\n'.repeat(10),
		placeholder: 'Placeholder',
		multiline: true,
	},
};

export const WithResetButton = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		placeholder: 'Placeholder',
		hasResetButton: true,
	},
};
