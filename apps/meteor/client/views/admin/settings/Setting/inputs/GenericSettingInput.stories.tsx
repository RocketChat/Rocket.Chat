import { Field } from '@rocket.chat/fuselage';
import type { Meta } from '@storybook/react';

import GenericSettingInput from './GenericSettingInput';

export default {
	component: GenericSettingInput,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	decorators: [(fn) => <Field>{fn()}</Field>],
} satisfies Meta<typeof GenericSettingInput>;

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

export const WithResetButton = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		placeholder: 'Placeholder',
		hasResetButton: true,
	},
};
