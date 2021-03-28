import { Field } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import React from 'react';

import SelectSettingInput from './SelectSettingInput';

export default {
	title: 'admin/settings/inputs/SelectSettingInput',
	component: SelectSettingInput,
	decorators: [(storyFn) => <Field>{storyFn()}</Field>],
};

export const _default = () => (
	<SelectSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		values={[
			{ key: '1', i18nLabel: '1' },
			{ key: '2', i18nLabel: '2' },
			{ key: '3', i18nLabel: '3' },
		]}
		onChangeValue={action('changeValue')}
		onChangeEditor={action('changeEditor')}
	/>
);

export const disabled = () => (
	<SelectSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		values={[
			{ key: '1', i18nLabel: '1' },
			{ key: '2', i18nLabel: '2' },
			{ key: '3', i18nLabel: '3' },
		]}
		disabled
	/>
);

export const withValue = () => (
	<SelectSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		value='2'
		values={[
			{ key: '1', i18nLabel: '1' },
			{ key: '2', i18nLabel: '2' },
			{ key: '3', i18nLabel: '3' },
		]}
	/>
);

export const withResetButton = () => (
	<SelectSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		values={[
			{ key: '1', i18nLabel: '1' },
			{ key: '2', i18nLabel: '2' },
			{ key: '3', i18nLabel: '3' },
		]}
		hasResetButton
		onChangeValue={action('changeValue')}
		onResetButtonClick={action('resetButtonClick')}
	/>
);
