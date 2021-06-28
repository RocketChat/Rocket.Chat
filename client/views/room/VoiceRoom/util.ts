import { types } from 'mediasoup-client';
import { Dispatch, SetStateAction } from 'react';

import VoiceRoomClient from '../../../../app/voice-channel/client';
import { IRoom } from '../../../../definition/IRoom';
import { IVoiceRoomPeer } from '../../../../definition/IVoiceRoomPeer';

export const addListenersToMediasoupClient = (
	client: VoiceRoomClient,
	setPeers: Dispatch<SetStateAction<Array<IVoiceRoomPeer>>>,
): void => {
	client.on('allJoinedPeers', (data) => {
		setPeers(data);
	});

	client.on('newConsumer', (consumer: types.Consumer, peerID: string, peer) => {
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

	client.on('peerClosed', (id: string) => {
		setPeers((prev) => prev.filter((p) => p.id !== id));
	});

	client.on('peerJoined', (data) => {
		setPeers((prev) => prev.concat(data));
	});
};

export const protooConnectionWithVoiceRoomClient = async (
	room: IRoom,
	setPeers: Dispatch<SetStateAction<Array<IVoiceRoomPeer>>>,
	setClient: Dispatch<SetStateAction<VoiceRoomClient | null>>,
): Promise<void> => {
	const roomClient = new VoiceRoomClient({
		roomID: room._id,
		device: {},
		produce: true,
		consume: true,
		displayName: room.u.name || 'Anonymous',
		peerID: room.u._id,
		username: room.u.username,
		roomName: room.fname,
	});

	addListenersToMediasoupClient(roomClient, setPeers);
	await roomClient.join();
	setClient(roomClient);
};
