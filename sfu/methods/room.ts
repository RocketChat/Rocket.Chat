import { EventEmitter } from 'events';

import protoo from 'protoo-server';
import { types } from 'mediasoup';

import config from '../config';
import { getWorker } from './worker';

const rooms = new Map<string, Room>();

export class Room extends EventEmitter {
	roomID: string;

	protooRoom: protoo.Room;

	mediasoupRouter: types.Router;

	closed: boolean;

	static async create(worker: types.Worker, roomID: string): Promise<Room> {
		const protooRoom = new protoo.Room();

		const { mediaCodecs } = config.mediasoup.routerOptions;

		const mediasoupRouter = await worker.createRouter({ mediaCodecs });

		return new Room(roomID, protooRoom, mediasoupRouter);
	}

	constructor(roomID: string, protooRoom: protoo.Room, mediasoupRouter: types.Router) {
		super();

		this.roomID = roomID;

		this.closed = false;

		this.protooRoom = protooRoom;

		this.mediasoupRouter = mediasoupRouter;
	}

	close(): void {
		this.closed = true;

		this.protooRoom.close();

		this.mediasoupRouter.close();

		this.emit('close');
	}

	getRouterRtpCapibilities(): types.RtpCapabilities {
		return this.mediasoupRouter.rtpCapabilities;
	}

	async handleProtooConnection(peerID: string, protooWSTransport: protoo.WebSocketTransport, consume?: boolean): Promise<void> {
		const existingPeer = this.protooRoom.getPeer(peerID);

		if (existingPeer) {
			existingPeer.close();
		}

		const peer = await this.protooRoom.createPeer(peerID, protooWSTransport);

		peer.data.consume = consume;
		peer.data.joined = false;
		peer.data.displayName = undefined;
		peer.data.device = undefined;
		peer.data.rtpCapabilities = undefined;
		peer.data.sctpCapabilities = undefined;

		peer.data.transports = new Map();
		peer.data.producers = new Map();
		peer.data.consumers = new Map();

		// @TODO: peer connection handler

		peer.on('close', () => {
			if (this.closed) { return; }

			if (peer.data.joined) {
				// @TODO: Notify other peers, this peer left
			}

			for (const transport of peer.data.transports.values()) { transport.close(); }
		});
	}

	getJoinedPeers(excludePeer?: protoo.Peer): Array<protoo.Peer> {
		return this.protooRoom.peers.filter((peer) => peer.data.joined && peer !== excludePeer);
	}
}

export const getRoom = (roomID: string): Room | undefined => rooms.get(roomID);

export const createRoom = async (roomID: string): Promise<Room> => {
	const worker = getWorker();

	const room = await Room.create(worker, roomID);

	rooms.set(roomID, room);
	room.on('close', () => rooms.delete(roomID));

	return room;
};
