import { Field } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import React from 'react';

import IntSettingInput from './IntSettingInput';

export default {
	title: 'admin/settings/inputs/IntSettingInput',
	component: IntSettingInput,
	decorators: [(storyFn) => <Field>{storyFn()}</Field>],
};

export const _default = () => (
	<IntSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		onChangeValue={action('changeValue')}
		onChangeEditor={action('changeEditor')}
	/>
);

export const disabled = () => <IntSettingInput _id='setting_id' label='Label' placeholder='Placeholder' disabled />;

export const withValue = () => <IntSettingInput _id='setting_id' label='Label' value={12345} placeholder='Placeholder' />;

export const withResetButton = () => (
	<IntSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		hasResetButton
		onChangeValue={action('changeValue')}
		onResetButtonClick={action('resetButtonClick')}
	/>
);
