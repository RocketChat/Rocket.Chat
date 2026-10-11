import { Field } from '@rocket.chat/fuselage';
import type { Meta } from '@storybook/react';

import FontSettingInput from './FontSettingInput';

export default {
	component: FontSettingInput,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	decorators: [(fn) => <Field>{fn()}</Field>],
} satisfies Meta<typeof FontSettingInput>;

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
		placeholder: 'Placeholder',
		value: 'Roboto',
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
