import { Box, IconButton, Badge } from '@rocket.chat/fuselage';
import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import * as Status from '../../components/UserStatus';
import UserAvatar from '../../components/avatar/UserAvatar';
import Extended from './Extended';

export default {
	title: 'Sidebar/Extended',
	component: Extended,
	args: {
		clickable: true,
	},
	decorators: [
		(fn) => (
			<Box maxWidth='x300' bg='dark' borderRadius='x4'>
				{fn()}
			</Box>
		),
	],
} as ComponentMeta<typeof Extended>;

const Template: ComponentStory<typeof Extended> = (args) => (
	<Extended
		{...args}
		title={
			<Box display='flex' flexDirection='row' w='full' alignItems='center'>
				<Box flexGrow='1' withTruncatedText>
					John Doe
				</Box>
				<Box fontScale='micro'>15:38</Box>
			</Box>
		}
		subtitle={
			<Box display='flex' flexDirection='row' w='full' alignItems='center'>
				<Box flexGrow='1' withTruncatedText>
					John Doe: test 123
				</Box>
				<Badge
					{...({
						style: {
							backgroundColor: '#6c727a',
							color: 'var(--rcx-color-surface, white)',
							flexShrink: 0,
						},
					} as any)}
				>
					99
				</Badge>
			</Box>
		}
		titleIcon={
			<Box mi={4}>
				<Status.Online />
			</Box>
		}
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
