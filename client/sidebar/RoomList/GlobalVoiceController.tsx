import { Box, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import React, { FC, ReactElement, useState, useEffect } from 'react';

import { useVoiceRoomContext } from '../../views/room/contexts/VoiceRoomContext';

const GlobalVoiceController: FC = (): ReactElement | null => {
	const { mediasoupClient } = useVoiceRoomContext();
	const [muteMic, setMuteMic] = useState(mediasoupClient?.muted || false);
	const [deafen, setDeafen] = useState(mediasoupClient?.deafen || false);
	const [connected, setConnected] = useState(mediasoupClient?.joined || false);

	const toggleMic = async (): Promise<void> => {
		if (mediasoupClient?.muted) {
			await mediasoupClient?.unmuteMic();
		} else {
			await mediasoupClient?.muteMic();
		}
		setMuteMic(mediasoupClient?.muted || false);
	};

	const toggleDeafen = (): void => setDeafen(mediasoupClient?.toggleDeafen() || false);

	const handleDisconnect = async (): Promise<void> => {
		mediasoupClient?.emit('global-disconnection');
	};

	useEffect(() => {
		if (mediasoupClient?.joined) {
			setConnected(true);
		} else {
			setConnected(false);
		}
	}, [mediasoupClient, mediasoupClient?.joined]);

	useEffect(() => {
		console.log(mediasoupClient);
	}, [mediasoupClient]);

	return connected ? (
		<Box w='full' padding='0.5rem 1rem'>
			<Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
				<p style={{ color: '#CBCED1' }}>Voice Channel</p>
				<ButtonGroup>
					<Button square ghost onClick={toggleMic}>
						{muteMic ? <Icon name='mic-off' size='x20' /> : <Icon name='mic' size='x20' />}
					</Button>
					<Button square ghost onClick={toggleDeafen}>
						{deafen ? (
							<Icon name='headphone-off' size='x20' />
						) : (
							<Icon name='headphone' size='x20' />
						)}
					</Button>
				</ButtonGroup>
			</Box>
			<Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
				<p style={{ color: '#CBCED1' }}>{mediasoupClient?.roomName}</p>
				<Button square primary danger onClick={handleDisconnect}>
					<Icon name='phone-off' size='x20' />
				</Button>
			</Box>
		</Box>
	) : null;
};

export default GlobalVoiceController;
