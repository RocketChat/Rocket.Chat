import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import UserAutoComplete from '.';

export default {
	title: 'Components/UserAutoComplete',
	component: UserAutoComplete,
	parameters: {
		layout: 'centered',
	},
} as ComponentMeta<typeof UserAutoComplete>;

export const Default: ComponentStory<typeof UserAutoComplete> = (args) => <UserAutoComplete {...args} />;
Default.storyName = 'UserAutoComplete';
