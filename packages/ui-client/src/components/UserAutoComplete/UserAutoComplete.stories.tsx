import type { Meta, StoryFn } from '@storybook/react';

import UserAutoComplete from '.';

export default {
	title: 'Components/UserAutoComplete',
	component: UserAutoComplete,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof UserAutoComplete>;

export const Default: StoryFn<typeof UserAutoComplete> = (args) => <UserAutoComplete {...args} />;
Default.storyName = 'UserAutoComplete';
