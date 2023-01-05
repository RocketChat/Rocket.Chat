import { Box, IconButton } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import * as Status from '../../components/UserStatus';
import UserAvatar from '../../components/avatar/UserAvatar';
import Condensed from './Condensed';

export default {
	title: 'Sidebar/Condensed',
	component: Condensed,
	args: {
		clickable: true,
		title: 'John Doe',
	},
	decorators: [
		(fn) => (
			<Box maxWidth='x300' bg='neutral-800' borderRadius='x4'>
				{fn()}
			</Box>
		),
	],
} as ComponentMeta<typeof Condensed>;

const Template: ComponentStory<typeof Condensed> = (args) => (
	<Condensed
		{...args}
		titleIcon={<Box mi='x4'>{<Status.Online />}</Box>}
		avatar={<UserAvatar username='john.doe' size='x16' url='https://via.placeholder.com/16' />}
	/>
);

export const Normal = Template.bind({});

export const Selected = Template.bind({});
Selected.args = {
	selected: true,
};

export const Menu = Template.bind({});
Menu.args = {
	menuOptions: {
		hide: {
			label: { label: 'Hide', icon: 'eye-off' },
			action: action('action'),
		},
		read: {
			label: { label: 'Mark_read', icon: 'flag' },
			action: action('action'),
		},
		favorite: {
			label: { label: 'Favorite', icon: 'star' },
			action: action('action'),
		},
	},
};

export const Actions = Template.bind({});
Actions.args = {
	actions: (
		<>
			<IconButton secondary success icon='phone' />
			<IconButton secondary danger icon='circle-cross' />
			<IconButton secondary info icon='trash' />
			<IconButton secondary icon='phone' />
		</>
	),
};
