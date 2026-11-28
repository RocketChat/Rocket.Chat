import type { StoryObj, Meta } from '@storybook/react';

import ResetSettingButton from './ResetSettingButton';

export default {
	component: ResetSettingButton,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof ResetSettingButton>;

export const Default: StoryObj<typeof ResetSettingButton> = {
	name: 'ResetSettingButton',
};
