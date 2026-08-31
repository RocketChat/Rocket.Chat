import { Field } from '@rocket.chat/fuselage';
import type { Meta } from '@storybook/react';

import RelativeUrlSettingInput from './RelativeUrlSettingInput';

export default {
	component: RelativeUrlSettingInput,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	decorators: [(fn) => <Field>{fn()}</Field>],
} satisfies Meta<typeof RelativeUrlSettingInput>;

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
