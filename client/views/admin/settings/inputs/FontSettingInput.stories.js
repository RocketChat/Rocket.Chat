import { Field } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import React from 'react';

import FontSettingInput from './FontSettingInput';

export default {
	title: 'admin/settings/inputs/FontSettingInput',
	component: FontSettingInput,
	decorators: [(storyFn) => <Field>{storyFn()}</Field>],
};

export const _default = () => (
	<FontSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		onChangeValue={action('changeValue')}
		onChangeEditor={action('changeEditor')}
	/>
);

export const disabled = () => <FontSettingInput _id='setting_id' label='Label' placeholder='Placeholder' disabled />;

export const withValue = () => <FontSettingInput _id='setting_id' label='Label' value='FiraCode' placeholder='Placeholder' />;

export const withResetButton = () => (
	<FontSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		hasResetButton
		onChangeValue={action('changeValue')}
		onResetButtonClick={action('resetButtonClick')}
	/>
);
