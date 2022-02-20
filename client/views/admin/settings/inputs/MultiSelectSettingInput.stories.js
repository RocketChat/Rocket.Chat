import { Field } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import React from 'react';

import MultiSelectSettingInput from './MultiSelectSettingInput';

export default {
	title: 'admin/settings/inputs/MultiSelectSettingInput',
	component: MultiSelectSettingInput,
	decorators: [(storyFn) => <Field>{storyFn()}</Field>],
};
const options = [
	{ key: '1', i18nLabel: '1' },
	{ key: '2', i18nLabel: '2' },
	{ key: '3', i18nLabel: '3' },
];

export const _default = () => (
	<MultiSelectSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		values={options}
		onChangeValue={action('changeValue')}
		onChangeEditor={action('changeEditor')}
	/>
);

export const disabled = () => (
	<MultiSelectSettingInput _id='setting_id' label='Label' placeholder='Placeholder' values={options} disabled />
);

export const withValue = () => (
	<MultiSelectSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		value={[
			[1, 'Lorem Ipsum'],
			[2, 'Lorem Ipsum'],
		]}
	/>
);

export const withResetButton = () => (
	<MultiSelectSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		values={options}
		hasResetButton
		onChangeValue={action('changeValue')}
		onResetButtonClick={action('resetButtonClick')}
	/>
);
