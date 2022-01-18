import { Box, ActionButton, Badge } from '@rocket.chat/fuselage';
import React from 'react';

import * as Status from '../../components/UserStatus';
import UserAvatar from '../../components/avatar/UserAvatar';
import Extended from './Extended';

export default {
	title: 'Sidebar/Extended',
	component: Extended,
};

const actions = (
	<>
		<ActionButton primary success icon='phone' />
		<ActionButton primary danger icon='circle-cross' />
		<ActionButton primary icon='trash' />
		<ActionButton icon='phone' />
	</>
);

const title = (
	<Box display='flex' flexDirection='row' w='full' alignItems='center'>
		<Box flexGrow='1' withTruncatedText>
			John Doe
		</Box>
		<Box fontScale='micro'>15:38</Box>
	</Box>
);

const subtitle = (
	<Box display='flex' flexDirection='row' w='full' alignItems='center'>
		<Box flexGrow='1' withTruncatedText>
			John Doe: test 123
		</Box>
		<Badge
			style={{
				backgroundColor: '#6c727a',
				color: 'var(--rcx-color-surface, white)',
				flexShrink: 0,
			}}
		>
			99
		</Badge>
	</Box>
);

const avatar = <UserAvatar size='x36' url='https://via.placeholder.com/16' />;

export const Normal = () => (
	<Box maxWidth='x300' bg='neutral-800' borderRadius='x4'>
		<Extended clickable title={title} subtitle={subtitle} titleIcon={<Box mi='x4'>{<Status.Online />}</Box>} avatar={avatar} />
	</Box>
);

export const Selected = () => (
	<Box maxWidth='x300' bg='neutral-800' borderRadius='x4'>
		<Extended clickable selected title={title} subtitle={subtitle} titleIcon={<Box mi='x4'>{<Status.Online />}</Box>} avatar={avatar} />
	</Box>
);

export const Menu = () => (
	<Box maxWidth='x300' bg='neutral-800' borderRadius='x4'>
		<Extended
			clickable
			title={title}
			subtitle={subtitle}
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
		<Extended
			clickable
			title='John Doe'
			subtitle='John Doe: test 123'
			titleIcon={<Box mi='x4'>{<Status.Online />}</Box>}
			avatar={avatar}
			actions={actions}
		/>
	</Box>
);
