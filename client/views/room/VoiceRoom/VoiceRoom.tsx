import { Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { types } from 'mediasoup-client';
import React, { FC, ReactElement, useState } from 'react';

import VoiceRoomClient from '../../../../app/voice-channel/client';
import { IRoom } from '../../../../definition/IRoom';
import { IVoiceRoomPeer } from '../../../../definition/IVoiceRoomPeer';
import VoicePeersList from './VoicePeersList';

interface IVoiceRoom {
	room: IRoom;
}

let roomClient: VoiceRoomClient;

const VoiceRoom: FC<IVoiceRoom> = ({ room }): ReactElement => {
	const [connected, setConnected] = useState(false);
	const [muteMic, setMuteMic] = useState(false);
	const [deafen, setDeafen] = useState(false);
	const [peers, setPeers] = useState<Array<IVoiceRoomPeer>>([]);

	const handleJoin = async (): Promise<void> => {
		roomClient = new VoiceRoomClient({
			roomID: room._id,
			device: {},
			produce: true,
			consume: true,
			displayName: room.u.name || 'Anonymous',
			peerID: room.u._id,
			username: room.u.username,
		});

		try {
			await roomClient.join();
			roomClient.on('newConsumer', (consumer: types.Consumer, peerID: string, peer) => {
				setPeers((prev) =>
					prev.concat({
						id: peerID,
						track: consumer.track,
						device: peer.device,
						displayName: peer.displayName,
						consumerId: consumer.id,
						username: peer.username,
					}),
				);
			});

			roomClient.on('peerClosed', (id: string) => {
				setPeers((prev) => prev.filter((p) => p.id !== id));
			});

			setConnected(true);
		} catch (err) {
			console.error(err);
		}
	};

	const handleDisconnect = (): void => {
		setConnected(false);
		roomClient.close();
		setPeers([]);
	};

	const toggleMic = (): void => {
		setMuteMic((prev) => {
			if (prev) {
				roomClient.unmuteMic();
			} else {
				roomClient.muteMic();
			}

			return !prev;
		});
	};

	const toggleDeafen = (): void => setDeafen((prev) => !prev);

	return (
		<>
			<VoicePeersList peers={peers} deafen={deafen} />
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
				{connected ? (
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
