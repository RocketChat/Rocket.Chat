import { Field } from '@rocket.chat/fuselage';
import React from 'react';

import ActionSettingInput from './ActionSettingInput';

export default {
	title: 'admin/settings/inputs/ActionSettingInput',
	component: ActionSettingInput,
	decorators: [(storyFn) => <Field>{storyFn()}</Field>],
};

export const _default = () => <ActionSettingInput _id='setting_id' actionText='Action text' value='methodName' />;

export const disabled = () => <ActionSettingInput _id='setting_id' actionText='Action text' value='methodName' disabled />;

export const withinChangedSection = () => (
	<ActionSettingInput _id='setting_id' actionText='Action text' value='methodName' sectionChanged />
);
