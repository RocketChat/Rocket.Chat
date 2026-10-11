import { Field } from '@rocket.chat/fuselage';
import type { Meta } from '@storybook/react';

import AssetSettingInput from './AssetSettingInput';

export default {
	component: AssetSettingInput,
	decorators: [
		(fn) => (
			<div>
				<div>
					<Field>{fn()}</Field>
				</div>
			</div>
		),
	],
} satisfies Meta<typeof AssetSettingInput>;

export const Default = {
	args: {
		_id: 'setting_id',
		label: 'Label',
	},
};

export const WithValue = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		value: { url: 'https://rocket.chat/images/logo.svg' },
	},
};

export const WithFileConstraints = {
	args: {
		_id: 'setting_id',
		label: 'Label',
		fileConstraints: { extensions: ['png', 'jpg', 'gif'] },
	},
};
