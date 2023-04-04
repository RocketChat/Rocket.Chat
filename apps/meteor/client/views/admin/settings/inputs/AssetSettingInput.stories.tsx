import { Field } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import AssetSettingInput from './AssetSettingInput';

export default {
	title: 'Admin/Settings/Inputs/AssetSettingInput',
	component: AssetSettingInput,
	decorators: [
		(fn) => (
			<div className='rc-old'>
				<div className='page-settings'>
					<Field>{fn()}</Field>
				</div>
			</div>
		),
	],
} as ComponentMeta<typeof AssetSettingInput>;

const Template: ComponentStory<typeof AssetSettingInput> = (args) => <AssetSettingInput {...args} />;

export const Default = Template.bind({});
Default.args = {
	_id: 'setting_id',
	label: 'Label',
};

export const WithValue = Template.bind({});
WithValue.args = {
	_id: 'setting_id',
	label: 'Label',
	value: { url: 'https://rocket.chat/images/logo.svg' },
};

export const WithFileConstraints = Template.bind({});
WithFileConstraints.args = {
	_id: 'setting_id',
	label: 'Label',
	fileConstraints: { extensions: ['png', 'jpg', 'gif'] },
};
