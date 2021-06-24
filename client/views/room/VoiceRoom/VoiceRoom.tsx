import { Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React, { FC, ReactElement, useEffect, useState } from 'react';

import VoiceRoomClient from '../../../../app/voice-channel/client';
import { IRoom } from '../../../../definition/IRoom';
import useVoiceRoom from '../hooks/useVoiceRoom';
import VoicePeersList from './VoicePeersList';

interface IVoiceRoom {
	room: IRoom;
}

let mediasoupConnectedClient: VoiceRoomClient | null = null;
let wsConnectedClient: VoiceRoomClient | null = null;

const VoiceRoom: FC<IVoiceRoom> = ({ room }): ReactElement => {
	const [connected, setConnected] = useState(mediasoupConnectedClient?.joined || false);
	const [muteMic, setMuteMic] = useState(false);
	const [deafen, setDeafen] = useState(false);

	const [firstClient, peers] = useVoiceRoom(room);
	const [secondClient, secondPeers] = useVoiceRoom(room);

	const handleInitialConnection = async (): Promise<void> => {
		try {
			if (mediasoupConnectedClient) {
				mediasoupConnectedClient.close();
			}

			mediasoupConnectedClient = null;
			mediasoupConnectedClient = firstClient;
			await mediasoupConnectedClient.join();
		} catch (err) {
			console.error(err);
		}
	};

	const handleSecondConnection = async (): Promise<void> => {
		try {
			if (wsConnectedClient) {
				wsConnectedClient.close();
			}
			wsConnectedClient = null;
			wsConnectedClient = secondClient;
			await wsConnectedClient.join();
		} catch (err) {
			console.log(err);
		}
	};

	const handleDisconnect = (): void => {
		setConnected(false);
		handleInitialConnection();
	};

	const toggleMic = (): void => {
		setMuteMic((prev) => {
			if (prev) {
				mediasoupConnectedClient?.unmuteMic();
			} else {
				mediasoupConnectedClient?.muteMic();
			}

			return !prev;
		});
	};

	const toggleDeafen = (): void => setDeafen((prev) => !prev);

	const handleJoin = async (): Promise<void> => {
		try {
			if (wsConnectedClient) {
				wsConnectedClient.close();
				wsConnectedClient = null;
			}

			await handleInitialConnection();
			mediasoupConnectedClient?.on('connectionOpened', async () => {
				await mediasoupConnectedClient?.joinRoom();
				setConnected(true);
				mediasoupConnectedClient?.removeListener('connectionOpened', () => null);
			});
		} catch (err) {
			console.log(err);
		}
	};

	useEffect(() => {
		if (!mediasoupConnectedClient || !mediasoupConnectedClient.joined) {
			mediasoupConnectedClient?.closeProtoo();
			handleInitialConnection();
		}

		if (
			mediasoupConnectedClient &&
			mediasoupConnectedClient.joined &&
			mediasoupConnectedClient.roomID !== secondClient.roomID
		) {
			secondClient?.closeProtoo();
			handleSecondConnection();
		}
	}, [room._id]);

	return (
		<>
			{mediasoupConnectedClient?.roomID !== room._id && (
				<VoicePeersList peers={secondPeers} deafen={deafen} />
			)}
			<Box display={mediasoupConnectedClient?.roomID !== room._id ? 'none' : 'block'}>
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
				{connected && mediasoupConnectedClient?.roomID === firstClient.roomID ? (
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
