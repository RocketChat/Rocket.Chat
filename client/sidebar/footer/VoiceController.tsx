import {
	SidebarItem,
	SidebarItemContent,
	SidebarItemAvatar,
	SidebarItemWrapper,
	SidebarItemTitle,
	SidebarItemContainer,
	SidebarItemActions,
	SidebarItemAction,
	SidebarFooter,
	SidebarSection,
	SidebarSectionTitle,
	TopBarAction,
} from '@rocket.chat/fuselage';
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

const VoiceController: FC = (): ReactElement | null => {
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
		<SidebarFooter elevated>
			<SidebarSection>
				<SidebarSectionTitle>Voice Channel</SidebarSectionTitle>
				<SidebarItemActions>
					{muted ? (
						<TopBarAction icon='mic-off' onClick={toggleMic} />
					) : (
						<TopBarAction icon='mic' onClick={toggleMic} />
					)}
					{deafen ? (
						<TopBarAction icon='headphone-off' onClick={toggleDeafen} />
					) : (
						<TopBarAction icon='headphone' onClick={toggleDeafen} />
					)}
				</SidebarItemActions>
			</SidebarSection>
			<SidebarItem>
				{room && roomAvatar && (
					<SidebarItemAvatar>{roomAvatar({ ...room, rid: room._id })}</SidebarItemAvatar>
				)}
				<SidebarItemContent>
					<SidebarItemContent>
						<SidebarItemWrapper>
							{room && <SidebarIcon room={room} highlighted={null} />}
							<SidebarItemTitle>{state.mediasoupClient.roomName}</SidebarItemTitle>
						</SidebarItemWrapper>
					</SidebarItemContent>
				</SidebarItemContent>
				<SidebarItemContainer>
					<SidebarItemActions>
						<SidebarItemAction icon='phone-off' danger primary onClick={handleDisconnect} />
					</SidebarItemActions>
				</SidebarItemContainer>
			</SidebarItem>
		</SidebarFooter>
	);
};

export default VoiceController;
