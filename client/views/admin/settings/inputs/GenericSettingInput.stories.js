import { Field } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import React from 'react';

import GenericSettingInput from './GenericSettingInput';

export default {
	title: 'admin/settings/inputs/GenericSettingInput',
	component: GenericSettingInput,
	decorators: [(storyFn) => <Field>{storyFn()}</Field>],
};

export const _default = () => (
	<GenericSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		onChangeValue={action('changeValue')}
		onChangeEditor={action('changeEditor')}
	/>
);

export const disabled = () => <GenericSettingInput _id='setting_id' label='Label' placeholder='Placeholder' disabled />;

export const withValue = () => <GenericSettingInput _id='setting_id' label='Label' value='Value' placeholder='Placeholder' />;

export const withResetButton = () => (
	<GenericSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		hasResetButton
		onChangeValue={action('changeValue')}
		onResetButtonClick={action('resetButtonClick')}
	/>
);
