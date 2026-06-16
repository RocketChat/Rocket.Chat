import { Field } from '@rocket.chat/fuselage';
import type { Meta } from '@storybook/react';

import LanguageSettingInput from './LanguageSettingInput';

export default {
	component: LanguageSettingInput,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	decorators: [(fn) => <Field>{fn()}</Field>],
} satisfies Meta<typeof LanguageSettingInput>;

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
		value: 'en',
	},
};

export const WithResetButton = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		placeholder: 'Placeholder',
		value: '1',
		hasResetButton: true,
	},
};
