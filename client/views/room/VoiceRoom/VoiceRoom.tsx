import { Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React, { FC, ReactElement, useEffect, useState } from 'react';

import VoiceRoomClient from '../../../../app/voice-channel/client';
import { IRoom } from '../../../../definition/IRoom';
import useVoiceRoom from '../hooks/useVoiceRoom';
import VoicePeersList from './VoicePeersList';

interface IVoiceRoom {
	room: IRoom;
}

let roomClient: VoiceRoomClient | null = null;

const VoiceRoom: FC<IVoiceRoom> = ({ room }): ReactElement => {
	const [connected, setConnected] = useState(roomClient?.joined || false);
	const [muteMic, setMuteMic] = useState(false);
	const [deafen, setDeafen] = useState(false);

	const [voiceRoomClient, peers] = useVoiceRoom(room);

	const handleInitialConnection = async (): Promise<void> => {
		try {
			if (roomClient) {
				roomClient.close();
			}

			roomClient = null;
			roomClient = voiceRoomClient;
			await roomClient.join();
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		console.log(peers);
	}, [peers]);

	const handleDisconnect = (): void => {
		setConnected(false);
		handleInitialConnection();
	};

	const toggleMic = (): void => {
		setMuteMic((prev) => {
			if (prev) {
				roomClient?.unmuteMic();
			} else {
				roomClient?.muteMic();
			}

			return !prev;
		});
	};

	const toggleDeafen = (): void => setDeafen((prev) => !prev);

	const handleJoin = async (): Promise<void> => {
		try {
			await handleInitialConnection();
			roomClient?.on('connectionOpened', async () => {
				await roomClient?.joinRoom();
				setConnected(true);
				roomClient?.removeListener('connectionOpened', () => null);
			});
		} catch (err) {
			console.log(err);
		}
	};

	useEffect(() => {
		if (!roomClient || !roomClient.joined) {
			roomClient?.closeProtoo();
			handleInitialConnection();
		}
	}, [room._id]);

	// @TO-DO change views for different room when client is joined

	return (
		<>
			<Box display={roomClient?.roomID !== voiceRoomClient.roomID ? 'none' : 'block'}>
				<VoicePeersList peers={peers} deafen={deafen} />
			</Box>
			<Box
				display='flex'
				position='fixed'
				style={{
					bottom: 0,
					left: 0,
					right: 0,
				}}
				justifyContent='center'
				alignItems='center'
				pb='x24'
			>
				{connected && roomClient?.roomID === voiceRoomClient.roomID ? (
					<ButtonGroup>
						<Button square onClick={toggleMic}>
							{muteMic ? <Icon name='mic-off' size='x24' /> : <Icon name='mic' size='x24' />}
						</Button>
						<Button primary danger square onClick={handleDisconnect}>
							<Icon name='phone-off' size='x24' />
						</Button>
						<Button square onClick={toggleDeafen}>
							{deafen ? <Icon name='headset-off' size='x24' /> : <Icon name='headset' size='x24' />}
						</Button>
					</ButtonGroup>
				) : (
					<Button primary success square onClick={handleJoin}>
						<Icon name='phone' size='x24' />
					</Button>
				)}
			</Box>
		</>
	);
};

export default VoiceRoom;
