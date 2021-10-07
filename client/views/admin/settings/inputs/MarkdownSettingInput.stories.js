import { Field } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import React from 'react';

import MarkdownSettingInput from './MarkdownSettingInput';

export default {
	title: 'admin/settings/inputs/MarkdownSettingInput',
	component: MarkdownSettingInput,
	decorators: [(storyFn) => <Field>{storyFn()}</Field>],
};

export const _default = () => (
	<MarkdownSettingInput
		_id='setting_id'
		label='Label'
		placeholder='Placeholder'
		value='asd'
		onChangeValue={action('changeValue')}
		onChangeEditor={action('changeEditor')}
	/>
);
