import { Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { types } from 'mediasoup-client';
import React, { FC, ReactElement, useState } from 'react';

import VoiceRoomClient from '../../../../app/voice-channel/client';
import { IRoom } from '../../../../definition/IRoom';

interface IVoiceRoom {
	room: IRoom;
}

let roomClient: VoiceRoomClient;

const VoiceRoom: FC<IVoiceRoom> = (props): ReactElement => {
	const { room } = props;

	const [connected, setConnected] = useState(false);
	const [muteMic, setMuteMic] = useState(false);

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
			roomClient.on('newConsumer', (consumer: types.Consumer, peer) => {
				const divEle = document.createElement('div');
				const pEle = document.createElement('p');

				pEle.innerText = peer.displayName;
				divEle.appendChild(pEle);

				const audioEle = document.createElement('audio');
				const audio = new MediaStream();

				audio.addTrack(consumer.track);
				audioEle.id = consumer.id;
				audioEle.srcObject = audio;
				audioEle.autoplay = true;

				divEle.appendChild(audioEle);

				document.getElementById('peer-audio-container')?.appendChild(divEle);
			});
			setConnected(true);
		} catch (err) {
			console.log(err);
		}
	};

	const handleDisconnect = (): void => {
		setConnected(false);

		roomClient.close();
		const ele = document.getElementById('peer-audio-container');
		while (ele?.lastElementChild) {
			ele.removeChild(ele.lastElementChild);
		}
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

	return (
		<>
			<Box id='peer-audio-container'></Box>
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
						<Button square onClick={toggleMic}>
							{muteMic ? <Icon name='mic-off' size='x24' /> : <Icon name='mic' size='x24' />}
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
