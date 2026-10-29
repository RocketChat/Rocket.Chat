import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import UserAutoComplete from '.';

export default {
	component: UserAutoComplete,
	parameters: {
		layout: 'centered',
	},
	decorators: [mockAppRoot().buildStoryDecorator()],
} satisfies Meta<typeof UserAutoComplete>;

export const Default: StoryObj<typeof UserAutoComplete> = {
	name: 'UserAutoComplete',
};
