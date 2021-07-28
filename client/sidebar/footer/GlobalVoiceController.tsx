import { Box, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import React, { FC, ReactElement } from 'react';

import VoiceRoomManager, {
	isMediasoupState,
	useVoiceChannel,
	useVoiceChannelDeafen,
	useVoiceChannelMic,
} from '../../../app/voice-channel/client/VoiceChannelManager';

const GlobalVoiceController: FC = (): ReactElement | null => {
	const state = useVoiceChannel();
	const muted = useVoiceChannelMic();
	const deafen = useVoiceChannelDeafen();

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

	return isMediasoupState(state) ? (
		<Box w='full' padding='0.5rem 1rem'>
			<Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
				<p style={{ color: '#CBCED1' }}>Voice Channel</p>
				<ButtonGroup>
					<Button square onClick={toggleMic}>
						{muted ? <Icon name='mic-off' size='x20' /> : <Icon name='mic' size='x20' />}
					</Button>
					<Button square onClick={toggleDeafen}>
						{deafen ? (
							<Icon name='headphone-off' size='x20' />
						) : (
							<Icon name='headphone' size='x20' />
						)}
					</Button>
				</ButtonGroup>
			</Box>
			<Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
				<p style={{ color: '#CBCED1' }}>{state.mediasoupClient.roomName}</p>
				<Button square primary danger onClick={handleDisconnect}>
					<Icon name='phone-off' size='x20' />
				</Button>
			</Box>
		</Box>
	) : null;
};

export default GlobalVoiceController;
