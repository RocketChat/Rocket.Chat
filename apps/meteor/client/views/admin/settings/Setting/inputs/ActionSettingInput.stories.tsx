import type { ServerMethods } from '@rocket.chat/ddp-client';
import type { Meta } from '@storybook/react';

import ActionSettingInput from './ActionSettingInput';

export default {
	component: ActionSettingInput,
} satisfies Meta<typeof ActionSettingInput>;

export const Default = {
	args: {
		_id: 'setting_id',
		label: 'Test SMTP settings',
		actionText: 'Action text',
		value: 'methodName' as keyof ServerMethods,
	},
};

export const Disabled = {
	args: {
		_id: 'setting_id',
		label: 'Test SMTP settings',
		actionText: 'Action text',
		value: 'methodName' as keyof ServerMethods,
		disabled: true,
	},
};

export const WithinChangedSection = {
	args: {
		_id: 'setting_id',
		label: 'Test SMTP settings',
		actionText: 'Action text',
		value: 'methodName' as keyof ServerMethods,
		sectionChanged: true,
	},
};
