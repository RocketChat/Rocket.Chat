import { Field } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import React from 'react';

import PasswordSettingInput from './PasswordSettingInput';

export default {
	title: 'admin/settings/inputs/PasswordSettingInput',
	component: PasswordSettingInput,
	decorators: [(storyFn) => <Field>{storyFn()}</Field>],
};

export const _default = () => (
	<PasswordSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		onChangeValue={action('changeValue')}
		onChangeEditor={action('changeEditor')}
	/>
);

export const disabled = () => <PasswordSettingInput _id='setting_id' label='Label' placeholder='Placeholder' disabled />;

export const withValue = () => <PasswordSettingInput _id='setting_id' label='Label' value='5w0rdf15h' placeholder='Placeholder' />;

export const withResetButton = () => (
	<PasswordSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		hasResetButton
		onChangeValue={action('changeValue')}
		onResetButtonClick={action('resetButtonClick')}
	/>
);
