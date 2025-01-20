import type { Meta, StoryFn } from '@storybook/react';

import ResetSettingButton from './ResetSettingButton';

export default {
	title: 'Admin/Settings/ResetSettingButton',
	component: ResetSettingButton,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof ResetSettingButton>;

export const Default: StoryFn<typeof ResetSettingButton> = (args) => <ResetSettingButton {...args} />;
Default.storyName = 'ResetSettingButton';
