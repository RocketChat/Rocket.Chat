import { Box, IconButton } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';

import Condensed from './Condensed';
import * as Status from '../../components/UserStatus';

export default {
	title: 'Sidebar/Condensed',
	component: Condensed,
	args: {
		clickable: true,
		title: 'John Doe',
	},
	decorators: [
		(fn) => (
			<Box maxWidth='x300' bg='dark' borderRadius='x4'>
				{fn()}
			</Box>
		),
	],
} satisfies Meta<typeof Condensed>;

const Template: StoryFn<typeof Condensed> = (args) => (
	<Condensed
		{...args}
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
