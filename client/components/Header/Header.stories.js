import React from 'react';

import { SettingsContext } from '../../contexts/SettingsContext';
import { useRoomIcon } from '../../hooks/useRoomIcon';
import ToolBox from '../../views/room/Header/ToolBox';
import { addAction } from '../../views/room/lib/Toolbox';
import ToolboxProvider from '../../views/room/providers/ToolboxProvider';
import RoomAvatar from '../avatar/RoomAvatar';
import Header from './Header';

export default {
	title: 'room/Header',
	component: Header,
};

const room = {
	t: 'c',
	name: 'general general general general general general general general general general general general general general general general general general general',
	_id: 'GENERAL',
	encrypted: true,
	autoTranslate: true,
	autoTranslateLanguage: 'pt-BR',
};

const settings = {
	Favorite_Rooms: true,
	AutoTranslate_Enabled: true,
	E2E_Enable: true,
};

const settingContextValue = {
	hasPrivateAccess: true,
	isLoading: false,
	querySetting: (setting) => ({
		getCurrentValue: () => settings[setting],
		subscribe: () => () => undefined,
	}),
	querySettings: () => ({
		getCurrentValue: () => [],
		subscribe: () => () => undefined,
	}),
	dispatch: async () => undefined,
};

export const ChatHeader = () => {
	const icon = useRoomIcon(room);
	const avatar = <RoomAvatar room={room} />;
	return (
		<SettingsContext.Provider value={settingContextValue}>
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
						<Header.State onClick icon='star' />
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
		</SettingsContext.Provider>
	);
};

const toolboxRoom = {
	...room,
	msgs: 2,
	u: { username: 'rocket.cat' },
	usersCount: 2,
};

// const renderWithBadge = createHeaderActionRenderer(<Header.Badge variant='primary'>1</Header.Badge>);
// const renderWithRedBadge = createHeaderActionRenderer(<Header.Badge variant='danger'>2</Header.Badge>);
// const renderWithOrangeBadge = createHeaderActionRenderer(<Header.Badge variant='warning'>99</Header.Badge>);

const renderWithBadge = (props, index) => (
	<Header.ToolBoxAction index={index} {...props}>
		<Header.Badge variant='primary'>1</Header.Badge>
	</Header.ToolBoxAction>
);

const renderWithRedBadge = (props, index) => (
	<Header.ToolBoxAction index={index} {...props}>
		<Header.Badge variant='danger'>2</Header.Badge>
	</Header.ToolBoxAction>
);

const renderWithOrangeBadge = (props, index) => (
	<Header.ToolBoxAction index={index} {...props}>
		<Header.Badge variant='warning'>99</Header.Badge>
	</Header.ToolBoxAction>
);

addAction('render-action-example-badge', {
	groups: ['channel'],
	id: 'render-action-example',
	title: 'Example',
	icon: 'phone',
	template: 'b',
	order: 0,
	renderAction: renderWithBadge,
});

addAction('render-action-example-badge-warning', {
	groups: ['channel'],
	id: 'render-action-example',
	title: 'Example',
	icon: 'thread',
	template: 'a',
	order: 1,
	renderAction: renderWithOrangeBadge,
});

addAction('render-action-example-badge-danger', {
	groups: ['channel'],
	id: 'render-action-example',
	title: 'Example',
	icon: 'discussion',
	template: 'c',
	order: 2,
	renderAction: renderWithRedBadge,
});

export const WithToolboxContext = () => {
	const icon = useRoomIcon(room);
	const avatar = <RoomAvatar room={room} />;
	return (
		<SettingsContext.Provider value={settingContextValue}>
			<Header>
				<Header.Avatar>{avatar}</Header.Avatar>
				<Header.Content>
					<Header.Content.Row>
						{icon && <Header.Icon icon={icon} />}
						<Header.Title>{room.name}</Header.Title>
						<Header.State onClick icon='star' />
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
		</SettingsContext.Provider>
	);
};

export const Omnichannel = () => {
	const icon = useRoomIcon(room);
	const avatar = <RoomAvatar room={room} />;
	return (
		<SettingsContext.Provider value={settingContextValue}>
			<Header>
				<Header.Avatar>{avatar}</Header.Avatar>
				<Header.Content>
					<Header.Content.Row>
						{icon && <Header.Icon icon={icon} />}
						<Header.Title>{room.name}</Header.Title>
						<Header.State onClick icon='star' />
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
		</SettingsContext.Provider>
	);
};
