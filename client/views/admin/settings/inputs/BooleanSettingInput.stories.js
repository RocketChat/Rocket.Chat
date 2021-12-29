import { Field } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import React from 'react';

import BooleanSettingInput from './BooleanSettingInput';

export default {
	title: 'admin/settings/inputs/BooleanSettingInput',
	component: BooleanSettingInput,
	decorators: [(storyFn) => <Field>{storyFn()}</Field>],
};

export const _default = () => <BooleanSettingInput _id='setting_id' label='Label' onChangeValue={action('changeValue')} />;

export const disabled = () => <BooleanSettingInput _id='setting_id' label='Label' disabled />;

export const checked = () => <BooleanSettingInput _id='setting_id' label='Label' value />;

export const withResetButton = () => (
	<BooleanSettingInput
		_id='setting_id'
		label='Label'
		hasResetButton
		onChangeValue={action('changeValue')}
		onResetButtonClick={action('resetButtonClick')}
	/>
);
