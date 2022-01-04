import { Field } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import React from 'react';

import CodeSettingInput from './CodeSettingInput';

export default {
	title: 'admin/settings/inputs/CodeSettingInput',
	component: CodeSettingInput,
	decorators: [
		(storyFn) => (
			<div className='rc-old'>
				<Field>{storyFn()}</Field>
			</div>
		),
	],
};

export const _default = () => (
	<CodeSettingInput _id='setting_id' label='Label' code='javascript' placeholder='Placeholder' onChangeValue={action('changeValue')} />
);

export const disabled = () => <CodeSettingInput _id='setting_id' label='Label' code='javascript' placeholder='Placeholder' disabled />;

export const withValue = () => <CodeSettingInput _id='setting_id' label='Label' value='Value' placeholder='Placeholder' />;

export const withResetButton = () => (
	<CodeSettingInput
		_id='setting_id'
		label='Label'
		value='Value'
		placeholder='Placeholder'
		hasResetButton
		onChangeValue={action('changeValue')}
		onResetButtonClick={action('resetButtonClick')}
	/>
);
