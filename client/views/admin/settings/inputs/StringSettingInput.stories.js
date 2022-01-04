import { Field } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import React from 'react';

import StringSettingInput from './StringSettingInput';

export default {
	title: 'admin/settings/inputs/StringSettingInput',
	component: StringSettingInput,
	decorators: [(storyFn) => <Field>{storyFn()}</Field>],
};

export const _default = () => (
	<StringSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		onChangeValue={action('changeValue')}
		onChangeEditor={action('changeEditor')}
	/>
);

export const disabled = () => <StringSettingInput _id='setting_id' label='Label' placeholder='Placeholder' disabled />;

export const withValue = () => <StringSettingInput _id='setting_id' label='Label' value='Value' placeholder='Placeholder' />;

export const multiline = () => (
	<StringSettingInput _id='setting_id' label='Label' value={'Value\n'.repeat(10)} placeholder='Placeholder' multiline />
);

export const withResetButton = () => (
	<StringSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		hasResetButton
		onChangeValue={action('changeValue')}
		onResetButtonClick={action('resetButtonClick')}
	/>
);
