import { Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React, { FC, ReactElement, useState } from 'react';

import VoiceRoomClient from '../../../../app/voice-channel/client';
import { IRoom } from '../../../../definition/IRoom';

interface IVoiceRoom {
	room: IRoom;
}

const VoiceRoom: FC<IVoiceRoom> = (props): ReactElement => {
	const { room } = props;

	const [connected, setConnected] = useState(false);

	let roomClient: VoiceRoomClient;

	const handleJoin = async (): Promise<void> => {
		roomClient = new VoiceRoomClient({
			roomID: room._id,
			device: {},
			produce: true,
			consume: true,
			displayName: room.u.name || 'Anonymous',
			peerID: room.u._id,
		});

		try {
			await roomClient.join();
			setConnected(true);
		} catch (err) {
			console.log(err);
		}
	};

	const handleDisconnect = (): void => {
		setConnected(false);

		roomClient.close();
	};

	return (
		<>
			<Box
				display='flex'
				position='fixed'
				style={{ bottom: 0, left: 0, right: 0 }}
				justifyContent='center'
				alignItems='center'
				pb='x24'
			>
				{connected ? (
					<ButtonGroup>
						<Button square>
							<Icon name='mic' size='x24' />
						</Button>
						<Button primary danger square onClick={handleDisconnect}>
							<Icon name='phone-off' size='x24' />
						</Button>
						<Button square>
							<Icon name='volume' size='x24' />
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
