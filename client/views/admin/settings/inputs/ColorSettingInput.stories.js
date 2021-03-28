import { Field } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import React from 'react';

import ColorSettingInput from './ColorSettingInput';

export default {
	title: 'admin/settings/inputs/ColorSettingInput',
	component: ColorSettingInput,
	decorators: [(storyFn) => <Field>{storyFn()}</Field>],
};

export const _default = () => (
	<ColorSettingInput
		_id='setting_id'
		label='Label'
		editor='color'
		allowedTypes={['color', 'expression']}
		placeholder='Placeholder'
		onChangeValue={action('changeValue')}
		onChangeEditor={action('changeEditor')}
	/>
);

export const disabled = () => (
	<ColorSettingInput
		_id='setting_id'
		label='Label'
		editor='color'
		allowedTypes={['color', 'expression']}
		placeholder='Placeholder'
		disabled
	/>
);

export const withValue = () => (
	<ColorSettingInput
		_id='setting_id'
		label='Label'
		editor='color'
		allowedTypes={['color', 'expression']}
		value='#db2323'
		placeholder='Placeholder'
	/>
);

export const withExpressionAsValue = () => (
	<ColorSettingInput
		_id='setting_id'
		label='Label'
		editor='expression'
		allowedTypes={['color', 'expression']}
		value='var(--rc-color-primary)'
		placeholder='Placeholder'
	/>
);

export const withResetButton = () => (
	<ColorSettingInput
		_id='setting_id'
		label='Label'
		editor='color'
		allowedTypes={['color', 'expression']}
		placeholder='Placeholder'
		hasResetButton
		onChangeValue={action('changeValue')}
		onResetButtonClick={action('resetButtonClick')}
	/>
);
