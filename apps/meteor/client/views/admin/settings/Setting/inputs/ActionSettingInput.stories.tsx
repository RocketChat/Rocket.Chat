import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Field } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { Meta } from '@storybook/react';

import ActionSettingInput from './ActionSettingInput';

export default {
	component: ActionSettingInput,
	decorators: [(fn) => <Field>{fn()}</Field>],
} satisfies Meta<typeof ActionSettingInput>;

export const Default = {
	args: {
		_id: 'setting_id',
		actionText: 'Action text' as TranslationKey,
		value: 'methodName' as keyof ServerMethods,
	},
};

export const Disabled = {
	args: {
		_id: 'setting_id',
		actionText: 'Action text' as TranslationKey,
		value: 'methodName' as keyof ServerMethods,
		disabled: true,
	},
};

export const WithinChangedSection = {
	args: {
		_id: 'setting_id',
		actionText: 'Action text' as TranslationKey,
		value: 'methodName' as keyof ServerMethods,
		sectionChanged: true,
	},
};
