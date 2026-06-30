import { Field } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { Meta } from '@storybook/react';

import SelectSettingInput from './SelectSettingInput';

export default {
	component: SelectSettingInput,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	decorators: [(fn) => <Field>{fn()}</Field>],
} satisfies Meta<typeof SelectSettingInput>;

export const Default = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		placeholder: 'Placeholder',
		values: [
			{ key: '1', i18nLabel: '1' as TranslationKey },
			{ key: '2', i18nLabel: '2' as TranslationKey },
			{ key: '3', i18nLabel: '3' as TranslationKey },
		],
	},
};

export const Disabled = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		placeholder: 'Placeholder',
		values: [
			{ key: '1', i18nLabel: '1' as TranslationKey },
			{ key: '2', i18nLabel: '2' as TranslationKey },
			{ key: '3', i18nLabel: '3' as TranslationKey },
		],
		disabled: true,
	},
};

export const WithValue = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		placeholder: 'Placeholder',
		value: '2',
		values: [
			{ key: '1', i18nLabel: '1' as TranslationKey },
			{ key: '2', i18nLabel: '2' as TranslationKey },
			{ key: '3', i18nLabel: '3' as TranslationKey },
		],
	},
};

export const WithResetButton = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		placeholder: 'Placeholder',
		values: [
			{ key: '1', i18nLabel: '1' as TranslationKey },
			{ key: '2', i18nLabel: '2' as TranslationKey },
			{ key: '3', i18nLabel: '3' as TranslationKey },
		],
		hasResetButton: true,
	},
};
