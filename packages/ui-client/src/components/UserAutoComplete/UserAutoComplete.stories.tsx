import type { Meta, StoryObj } from '@storybook/react';

import UserAutoComplete from './index.js';

export default {
	component: UserAutoComplete,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof UserAutoComplete>;

export const Default: StoryObj<typeof UserAutoComplete> = {
	name: 'UserAutoComplete',
};
