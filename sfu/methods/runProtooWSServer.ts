import http from 'http';
import url from 'url';

import { WebSocketServer } from 'protoo-server';
import { AwaitQueue } from 'awaitqueue';

import { createRoom, getRoom } from './room';

let protooWSServer: WebSocketServer;

const queue = new AwaitQueue();

export const runProtooWSServer = async (server: http.Server): Promise<void> => {
	protooWSServer = new WebSocketServer(server, {
		maxReceivedFrameSize: 960000, // 960 KBytes.
		maxReceivedMessageSize: 960000,
		fragmentOutgoingMessages: true,
		fragmentationThreshold: 960000,
	});

	protooWSServer.on('connectionrequest', (info, accept, reject) => {
		// Get room id and peer id from info
		const u = url.parse(info.request.url || '', true);
		const { roomId, peerId } = u.query;

		const roomID = typeof roomId === 'string' ? roomId : roomId[0];
		const peerID = typeof peerId === 'string' ? peerId : peerId[0];

		if (!roomID || !peerID) { reject(400, 'Invalid RoomID or PeerID.\n'); }

		queue.push(async () => {
			let room = getRoom(roomID);

			if (!room) {
				room = await createRoom(roomID);
			}

			const protooWSTransport = accept();

			room.handleProtooConnection(peerID, protooWSTransport);
		}).catch((err) => {
			reject(err);
		});
	});
};
