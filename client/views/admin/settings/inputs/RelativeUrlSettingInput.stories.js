import { Field } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import React from 'react';

import RelativeUrlSettingInput from './RelativeUrlSettingInput';

export default {
	title: 'admin/settings/inputs/RelativeUrlSettingInput',
	component: RelativeUrlSettingInput,
	decorators: [(storyFn) => <Field>{storyFn()}</Field>],
};

export const _default = () => (
	<RelativeUrlSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		onChangeValue={action('changeValue')}
		onChangeEditor={action('changeEditor')}
	/>
);

export const disabled = () => <RelativeUrlSettingInput _id='setting_id' label='Label' placeholder='Placeholder' disabled />;

export const withValue = () => <RelativeUrlSettingInput _id='setting_id' label='Label' value='Value' placeholder='Placeholder' />;

export const withResetButton = () => (
	<RelativeUrlSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		hasResetButton
		onChangeValue={action('changeValue')}
		onResetButtonClick={action('resetButtonClick')}
	/>
);
