import type { IRoom } from '@rocket.chat/core-typings';
import { SettingsContext } from '@rocket.chat/ui-contexts';
import { action } from '@storybook/addon-actions';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import Header from '.';
import { useRoomIcon } from '../../hooks/useRoomIcon';
import ToolBox from '../../views/room/Header/ToolBox';
import { ActionRenderer, addAction } from '../../views/room/lib/Toolbox';
import ToolboxProvider from '../../views/room/providers/ToolboxProvider';
import RoomAvatar from '../avatar/RoomAvatar';

export default {
	title: 'Components/Header',
	component: Header,
	subcomponents: {
		'Header.ToolBox': Header.ToolBox,
		'Header.ToolBoxAction': Header.ToolBoxAction,
		'Header.Avatar': Header.Avatar,
		'Header.Content': Header.Content,
		'Header.Content.Row': Header.Content.Row,
	},
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(fn) => (
			<SettingsContext.Provider
				value={{
					hasPrivateAccess: true,
					isLoading: false,
					querySetting: (_id) => ({
						getCurrentValue: () => ({
							_id,
							type: 'action',
							value: '',
							public: true,
							blocked: false,
							createdAt: new Date(),
							env: true,
							i18nLabel: _id,
							packageValue: false,
							sorter: 1,
							ts: new Date(),
						}),
						subscribe: () => () => undefined,
					}),
					querySettings: () => ({
						getCurrentValue: () => [],
						subscribe: () => () => undefined,
					}),
					dispatch: async () => undefined,
				}}
			>
				{fn()}
			</SettingsContext.Provider>
		),
	],
} as ComponentMeta<typeof Header>;

const room: IRoom = {
	t: 'c',
	name: 'general general general general general general general general general general general general general general general general general general general',
	_id: 'GENERAL',
	encrypted: true,
	autoTranslate: true,
	autoTranslateLanguage: 'pt-BR',
	u: {
		_id: 'rocket.cat',
		name: 'rocket.cat',
		username: 'rocket.cat',
	},
	msgs: 123,
	usersCount: 3,
	_updatedAt: new Date(),
} as const;

export const ChatHeader = () => {
	const icon = useRoomIcon(room);
	const avatar = <RoomAvatar size='x40' room={room} />;

	return (
		<Header>
			<Header.ToolBox>
				<Header.ToolBoxAction icon='burger' />
				<Header.ToolBoxAction icon='back' />
			</Header.ToolBox>
			<Header.Avatar>{avatar}</Header.Avatar>
			<Header.Content>
				<Header.Content.Row>
					{icon && <Header.Icon icon={icon} />}
					<Header.Title>{room.name}</Header.Title>
					<Header.State onClick={action('onClick')} icon='star' />
					<Header.State icon='key' />
					<Header.State icon='language' />
				</Header.Content.Row>
				<Header.Content.Row>
					<Header.Subtitle>{room.name}</Header.Subtitle>
				</Header.Content.Row>
			</Header.Content>
			<Header.ToolBox>
				<Header.ToolBoxAction icon='magnifier' />
				<Header.ToolBoxAction icon='key' />
				<Header.ToolBoxAction icon='kebab' />
			</Header.ToolBox>
		</Header>
	);
};

const toolboxRoom: IRoom = {
	...room,
	msgs: 2,
	u: {
		_id: 'rocket.cat',
		name: 'rocket.cat',
		username: 'rocket.cat',
	},
	usersCount: 2,
};

const renderWithBadge: ActionRenderer = (props) => (
	<Header.ToolBoxAction {...props}>
		<Header.Badge variant='primary'>1</Header.Badge>
	</Header.ToolBoxAction>
);

const renderWithRedBadge: ActionRenderer = (props) => (
	<Header.ToolBoxAction {...props}>
		<Header.Badge variant='danger'>2</Header.Badge>
	</Header.ToolBoxAction>
);

const renderWithOrangeBadge: ActionRenderer = (props) => (
	<Header.ToolBoxAction {...props}>
		<Header.Badge variant='warning'>99</Header.Badge>
	</Header.ToolBoxAction>
);

addAction('render-action-example-badge', {
	id: 'render-action-example-badge',
	groups: ['channel'],
	title: 'Phone',
	icon: 'phone',
	template: 'b',
	order: 0,
	renderAction: renderWithBadge,
});

addAction('render-action-example-badge-warning', {
	id: 'render-action-example-badge-warning',
	groups: ['channel'],
	title: 'Threads',
	icon: 'thread',
	template: 'a',
	order: 1,
	renderAction: renderWithOrangeBadge,
});

addAction('render-action-example-badge-danger', {
	id: 'render-action-example-badge-danger',
	groups: ['channel'],
	title: 'Discussion',
	icon: 'discussion',
	template: 'c',
	order: 2,
	renderAction: renderWithRedBadge,
});

export const WithToolboxContext: ComponentStory<typeof Header> = () => {
	const icon = useRoomIcon(room);
	const avatar = <RoomAvatar size='x40' room={room} />;
	return (
		<Header>
			<Header.Avatar>{avatar}</Header.Avatar>
			<Header.Content>
				<Header.Content.Row>
					{icon && <Header.Icon icon={icon} />}
					<Header.Title>{room.name}</Header.Title>
					<Header.State onClick={action('onClick')} icon='star' />
					<Header.State icon='key' />
					<Header.State icon='language' />
				</Header.Content.Row>
				<Header.Content.Row>
					<Header.Subtitle>{room.name}</Header.Subtitle>
				</Header.Content.Row>
			</Header.Content>
			<Header.ToolBox>
				<ToolboxProvider room={toolboxRoom}>
					<ToolBox />
				</ToolboxProvider>
			</Header.ToolBox>
		</Header>
	);
};

export const Omnichannel = () => {
	const icon = useRoomIcon(room);
	const avatar = <RoomAvatar size='x40' room={room} />;
	return (
		<Header>
			<Header.Avatar>{avatar}</Header.Avatar>
			<Header.Content>
				<Header.Content.Row>
					{icon && <Header.Icon icon={icon} />}
					<Header.Title>{room.name}</Header.Title>
					<Header.State onClick={action('onClick')} icon='star' />
					<Header.State icon='key' />
					<Header.State icon='language' />
				</Header.Content.Row>
				<Header.Content.Row>
					<Header.Subtitle>{room.name}</Header.Subtitle>
				</Header.Content.Row>
			</Header.Content>
			<Header.ToolBox>
				<ToolboxProvider room={toolboxRoom}>
					<ToolBox />
				</ToolboxProvider>
			</Header.ToolBox>
		</Header>
	);
};
