import { Field } from '@rocket.chat/fuselage';
import type { Meta } from '@storybook/react';

import ColorSettingInput from './ColorSettingInput';

export default {
	component: ColorSettingInput,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	decorators: [(fn) => <Field>{fn()}</Field>],
} satisfies Meta<typeof ColorSettingInput>;

export const Default = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		editor: 'color',
		allowedTypes: ['color', 'expression'],
		placeholder: 'Placeholder',
	},
};

export const Disabled = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		editor: 'color',
		allowedTypes: ['color', 'expression'],
		placeholder: 'Placeholder',
		disabled: true,
	},
};

export const WithValue = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		editor: 'color',
		allowedTypes: ['color', 'expression'],
		value: '#db2323',
		placeholder: 'Placeholder',
	},
};

export const WithExpressionAsValue = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		editor: 'expression',
		allowedTypes: ['color', 'expression'],
		value: 'var(--rc-color-primary)',
		placeholder: 'Placeholder',
	},
};

export const WithResetButton = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		editor: 'color',
		allowedTypes: ['color', 'expression'],
		placeholder: 'Placeholder',
		hasResetButton: true,
	},
};
