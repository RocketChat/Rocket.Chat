import { Field } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import React from 'react';

import MarkdownSettingInput from './MarkdownSettingInput';

export default {
	title: 'admin/settings/inputs/MarkdownSettingInput',
	component: MarkdownSettingInput,
	decorators: [(storyFn: () => any): any => <Field>{storyFn()}</Field>],
};

export const _default = (): any => (
	<MarkdownSettingInput
		_id='setting_id'
		label='Label'
		value='asd'
		onChangeValue={action('changeValue')}
		hasResetButton={true}
		onResetButtonClick={action('resetButtonClick')}
	/>
);
