import { Box, ActionButton } from '@rocket.chat/fuselage';
import React from 'react';

import * as Status from '../../components/UserStatus';
import UserAvatar from '../../components/avatar/UserAvatar';
import Medium from './Medium';

export default {
	title: 'Sidebar/Medium',
	component: Medium,
};

const actions = (
	<>
		<ActionButton primary success icon='phone' />
		<ActionButton primary danger icon='circle-cross' />
		<ActionButton primary icon='trash' />
		<ActionButton icon='phone' />
	</>
);

const avatar = <UserAvatar size='x28' url='https://via.placeholder.com/16' />;

export const Normal = () => (
	<Box maxWidth='x300' bg='neutral-800' borderRadius='x4'>
		<Medium clickable title='John Doe' titleIcon={<Box mi='x4'>{<Status.Online />}</Box>} avatar={avatar} />
	</Box>
);

export const Selected = () => (
	<Box maxWidth='x300' bg='neutral-800' borderRadius='x4'>
		<Medium clickable selected title='John Doe' titleIcon={<Box mi='x4'>{<Status.Online />}</Box>} avatar={avatar} />
	</Box>
);

export const Menu = () => (
	<Box maxWidth='x300' bg='neutral-800' borderRadius='x4'>
		<Medium
			clickable
			title='John Doe'
			titleIcon={<Box mi='x4'>{<Status.Online />}</Box>}
			avatar={avatar}
			menuOptions={{
				hide: {
					label: { label: 'Hide', icon: 'eye-off' },
					action: () => {},
				},
				read: {
					label: { label: 'Mark_read', icon: 'flag' },
					action: () => {},
				},
				favorite: {
					label: { label: 'Favorite', icon: 'star' },
					action: () => {},
				},
			}}
		/>
	</Box>
);

export const Actions = () => (
	<Box maxWidth='x300' bg='neutral-800' borderRadius='x4'>
		<Medium clickable title='John Doe' titleIcon={<Box mi='x4'>{<Status.Online />}</Box>} avatar={avatar} actions={actions} />
	</Box>
);
