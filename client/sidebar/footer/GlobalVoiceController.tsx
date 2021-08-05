import { Box, ButtonGroup, Button, Icon, Sidebar } from '@rocket.chat/fuselage';
import React, { FC, ReactElement } from 'react';

import VoiceRoomManager, {
	isMediasoupState,
	useVoiceChannel,
	useVoiceChannelDeafen,
	useVoiceChannelMic,
} from '../../../app/voice-channel/client/VoiceChannelManager';
import { useUserRoom } from '../../contexts/UserContext';
import SidebarIcon from '../RoomList/SidebarIcon';
import { useAvatarTemplate } from '../hooks/useAvatarTemplate';

const GlobalVoiceController: FC = (): ReactElement | null => {
	const state = useVoiceChannel();
	const rid = (state.state === 'connected' && state.rid) || '';
	const room = useUserRoom(rid);
	const roomAvatar = useAvatarTemplate();
	const muted = useVoiceChannelMic();
	const deafen = useVoiceChannelDeafen();

	if (!isMediasoupState(state)) {
		return null;
	}

	const handleDisconnect = (): void => {
		VoiceRoomManager.disconnect();
		// @TODO: handle establishing websocket reconnection using VoiceRoomManager.connect(rid, room);
	};

	const toggleMic = (): void => {
		VoiceRoomManager.toggleMic();
	};

	const toggleDeafen = (): void => {
		VoiceRoomManager.toggleDeafen();
	};

	return (
		<Box w='full' padding='0.5rem 0' style={{ boxShadow: '-5px -0.5px 5px 0px #000000' }}>
			<Box
				display='flex'
				flexDirection='row'
				justifyContent='space-between'
				alignItems='center'
				margin='0 0 14px 0'
				padding='0 1rem'
			>
				<p style={{ color: '#CBCED1', fontWeight: 'bold' }}>Voice Channel</p>
				<ButtonGroup>
					<Button ghostish square style={{ margin: 0 }} small onClick={toggleMic}>
						{muted ? (
							<Icon name='mic-off' size='x24' color='#6C727A' />
						) : (
							<Icon name='mic' size='x24' color='#6C727A' />
						)}
					</Button>
					<Button ghostish square small onClick={toggleDeafen}>
						{deafen ? (
							<Icon name='headphone-off' size='x24' color='#6C727A' />
						) : (
							<Icon name='headphone' size='x24' color='#6C727A' />
						)}
					</Button>
				</ButtonGroup>
			</Box>
			<Sidebar.Item disabled style={{ backgroundColor: 'transparent' }}>
				{roomAvatar && <Sidebar.Item.Avatar>{roomAvatar(room)}</Sidebar.Item.Avatar>}
				<Sidebar.Item.Content>
					<Sidebar.Item.Content>
						<Sidebar.Item.Wrapper>
							{room && <SidebarIcon room={room} highlighted={null} />}
							<Sidebar.Item.Title>{state.mediasoupClient.roomName}</Sidebar.Item.Title>
						</Sidebar.Item.Wrapper>
					</Sidebar.Item.Content>
				</Sidebar.Item.Content>
				<Sidebar.Item.Container>
					<Sidebar.Item.Actions>
						<Button square primary danger onClick={handleDisconnect}>
							<Icon name='phone-off' size='x20' />
						</Button>
					</Sidebar.Item.Actions>
				</Sidebar.Item.Container>
			</Sidebar.Item>
		</Box>
	);
};

export default GlobalVoiceController;
