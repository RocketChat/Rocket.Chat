import { Field } from '@rocket.chat/fuselage';
import type { Meta } from '@storybook/react';

import CodeSettingInput from './CodeSettingInput';

export default {
	component: CodeSettingInput,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	decorators: [
		(fn) => (
			<div>
				<Field>{fn()}</Field>
			</div>
		),
	],
} satisfies Meta<typeof CodeSettingInput>;

export const Default = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		code: 'javascript',
		placeholder: 'Placeholder',
	},
};

export const Disabled = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		code: 'javascript',
		placeholder: 'Placeholder',
		disabled: true,
	},
};

export const WithValue = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		value: 'console.log("Hello World!");',
		placeholder: 'Placeholder',
	},
};

export const WithDescription = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		hint: 'Description: Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
		value: 'console.log("Hello World!");',
		placeholder: 'Placeholder',
	},
};

export const WithResetButton = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		value: 'console.log("Hello World!");',
		placeholder: 'Placeholder',
		hasResetButton: true,
	},
};
