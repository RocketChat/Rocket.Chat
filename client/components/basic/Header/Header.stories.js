import React from 'react';

import { SettingsContext } from '../../../contexts/SettingsContext';
import Header from './Header';
import RoomAvatar from '../avatar/RoomAvatar';
import { useRoomIcon } from '../../../hooks/useRoomIcon';

export default {
	title: 'Chat Header',
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
	const avatar = <RoomAvatar room={room}/>;
	return <SettingsContext.Provider value={settingContextValue}>
		<Header>
			<Header.Avatar>{avatar}</Header.Avatar>
			<Header.Content>
				<Header.Content.Row>
					{ icon && <Header.Icon icon={icon}/> }
					<Header.Title>{room.name}</Header.Title>
					<Header.State onClick icon='star'/>
					<Header.State icon='key'/>
					<Header.State icon='language'/>
				</Header.Content.Row>
				<Header.Content.Row>
					<Header.Subtitle>{room.name}</Header.Subtitle>
				</Header.Content.Row>
			</Header.Content>
			<Header.Actions>
				<Header.Action icon='magnifier'/>
				<Header.Action icon='key'/>
				<Header.Action icon='kebab'/>
			</Header.Actions>
		</Header>
	</SettingsContext.Provider>;
};
