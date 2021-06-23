import { types } from 'mediasoup-client';
import { useState } from 'react';

import VoiceRoomClient from '../../../../app/voice-channel/client';
import { IRoom } from '../../../../definition/IRoom';
import { IVoiceRoomPeer } from '../../../../definition/IVoiceRoomPeer';

const useVoiceRoom = (room: IRoom): [VoiceRoomClient, Array<IVoiceRoomPeer>] => {
	const [peers, setPeers] = useState<Array<IVoiceRoomPeer>>([]);

	const roomClient = new VoiceRoomClient({
		roomID: room._id,
		device: {},
		produce: true,
		consume: true,
		displayName: room.u.name || 'Anonymous',
		peerID: room.u._id,
		username: room.u.username,
	});

	roomClient.on('allJoinedPeers', (data) => {
		setPeers(data);
	});

	roomClient.on('newConsumer', (consumer: types.Consumer, peerID: string, peer) => {
		setPeers((prev) => {
			let found = false;

			const P = prev.map((p) => {
				if (p.id === peerID) {
					p.track = consumer.track;
					p.consumerId = consumer.id;
					found = true;
				}
				return p;
			});

			if (!found) {
				return prev.concat({
					id: peerID,
					track: consumer.track,
					device: peer.device,
					displayName: peer.displayName,
					consumerId: consumer.id,
					username: peer.username,
				});
			}

			return P;
		});
	});

	roomClient.on('peerClosed', (id: string) => {
		setPeers((prev) => prev.filter((p) => p.id !== id));
	});

	roomClient.on('peerJoined', (data) => {
		setPeers((prev) => prev.concat(data));
	});

	return [roomClient, peers];
};

export default useVoiceRoom;
