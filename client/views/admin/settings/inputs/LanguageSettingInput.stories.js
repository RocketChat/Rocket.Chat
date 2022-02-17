import { Field } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import React from 'react';

import LanguageSettingInput from './LanguageSettingInput';

export default {
	title: 'admin/settings/inputs/LanguageSettingInput',
	component: LanguageSettingInput,
	decorators: [(storyFn) => <Field>{storyFn()}</Field>],
};

export const _default = () => (
	<LanguageSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		onChangeValue={action('changeValue')}
		onChangeEditor={action('changeEditor')}
	/>
);

export const disabled = () => <LanguageSettingInput _id='setting_id' label='Label' placeholder='Placeholder' disabled />;

export const withValue = () => <LanguageSettingInput _id='setting_id' label='Label' placeholder='Placeholder' value='en' />;

export const withResetButton = () => (
	<LanguageSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		values={[
			{ key: '1', i18nLabel: '1' },
			{ key: '2', i18nLabel: '2' },
			{ key: '3', i18nLabel: '3' },
		]}
		hasResetButton
		onChangeValue={action('changeValue')}
		onResetButtonClick={action('resetButtonClick')}
	/>
);
