import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import ResetSettingButton from './ResetSettingButton';

export default {
	title: 'Admin/Settings/ResetSettingButton',
	component: ResetSettingButton,
	parameters: {
		layout: 'centered',
	},
} as ComponentMeta<typeof ResetSettingButton>;

export const Default: ComponentStory<typeof ResetSettingButton> = (args) => <ResetSettingButton {...args} />;
Default.storyName = 'ResetSettingButton';
