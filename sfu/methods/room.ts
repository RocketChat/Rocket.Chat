import { EventEmitter } from 'events';

import protoo from 'protoo-server';
import { types } from 'mediasoup';

import config from '../config';
import { getWorker } from './worker';
import { IPeer } from '../types/IPeer';
import { createConsumer } from './createConsumer';
import { createProducer } from './createProducer';

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

		const peer: IPeer = await this.protooRoom.createPeer(peerID, protooWSTransport);

		peer.data.consume = consume;
		peer.data.joined = false;
		peer.data.displayName = undefined;
		peer.data.device = undefined;
		peer.data.rtpCapabilities = undefined;

		peer.data.transports = new Map();
		peer.data.producers = new Map();
		peer.data.consumers = new Map();

		peer.on('request', (request, accept, reject) => this.handleProtooRequest(peer, request, accept, reject)
			.catch((err) => reject(err)));

		peer.on('close', () => {
			if (this.closed) { return; }

			if (peer.data.joined) {
				// @TODO: Notify other peers, this peer left
			}

			for (const transport of peer.data.transports.values()) { transport.close(); }
		});
	}

	getJoinedPeers(excludePeer?: IPeer): Array<IPeer> {
		return this.protooRoom.peers.filter((peer) => peer.data.joined && peer !== excludePeer);
	}

	async handleProtooRequest(peer: IPeer, request: protoo.ProtooRequest, accept: protoo.AcceptFn, _reject: protoo.RejectFn): Promise<void> {
		switch (request.method) {
			case 'createWebRtcTransport': {
				const {
					forceTcp,
					producing,
					consuming,
				} = request.data;

				const webRtcTransportOptions =				{
					...config.mediasoup.webRtcTransportOptions,
					enableSctp: false,
					appData: { producing, consuming },
				};

				if (forceTcp) {
					webRtcTransportOptions.enableUdp = false;
					webRtcTransportOptions.enableTcp = true;
				}

				const transport = await this.mediasoupRouter.createWebRtcTransport(webRtcTransportOptions);

				peer.data.transports.set(transport.id, transport);

				accept({
					id: transport.id,
					iceParameters: transport.iceParameters,
					iceCandidates: transport.iceCandidates,
					dtlsParameters: transport.dtlsParameters,
					sctpParameters: transport.sctpParameters,
				});

				break;
			}

			case 'connectWebRtcTransport': {
				const { transportId, dtlsParameters } = request.data;
				const transport = peer.data.transports.get(transportId);

				if (!transport) {
					throw new Error(`Transport with id:${ transportId } not found.`);
				}

				await transport.connect({ dtlsParameters });

				accept(null);

				break;
			}

			case 'getRouterRtpCapibilities': {
				accept(this.mediasoupRouter.rtpCapabilities);
				break;
			}

			case 'join': {
				if (peer.data.joined) {
					throw new Error('Peer Already Joined.');
				}

				const {
					displayName,
					device,
					rtpCapabilities,
				} = request.data;

				peer.data.joined = true;
				peer.data.rtpCapabilities = rtpCapabilities;
				peer.data.displayName = displayName;
				peer.data.device = device;

				const joinedPeers = { ...this.getJoinedPeers() };

				const peerInfos = joinedPeers
					.filter((joinedPeer) => joinedPeer.id !== peer.id)
					.map((joinedPeer) => ({
						id: joinedPeer.id,
						displayName: joinedPeer.data.displayName,
						device: joinedPeer.data.device,
					}));

				accept({ peers: peerInfos });

				peer.data.joined = true;

				joinedPeers.forEach((joinedPeer) => {
					for (const producer of joinedPeer.data.producers.values()) {
						createConsumer(this.mediasoupRouter, peer, joinedPeer, producer);
					}
				});

				break;
			}

			case 'produce': {
				if (!peer.data.joined) {
					throw new Error('Peer yet to join.');
				}

				const producerId = createProducer(peer, request.data);

				accept({ id: producerId });

				break;
			}

			case 'closeProducer': {
				if (!peer.data.joined) {
					throw new Error('Peer yet to join.');
				}

				const { producerId } = request.data;
				const producer = peer.data.producers.get(producerId);


				if (!producer) {
					throw new Error(`Producer with ${ producerId } not found.`);
				}

				producer.close();

				peer.data.producers.delete(producer.id);

				accept(null);

				break;
			}

			case 'pauseProducer':
			{
				if (!peer.data.joined) { throw new Error('Peer yet to joined.'); }

				const { producerId } = request.data;
				const producer = peer.data.producers.get(producerId);

				if (!producer) { throw new Error(`Producer with id "${ producerId }" not found.`); }

				await producer.pause();

				accept(null);

				break;
			}

			case 'resumeProducer':
			{
				if (!peer.data.joined) { throw new Error('Peer yet to joined.'); }

				const { producerId } = request.data;
				const producer = peer.data.producers.get(producerId);

				if (!producer) { throw new Error(`Producer with id "${ producerId }" not found.`); }

				await producer.resume();

				accept(null);

				break;
			}

			case 'pauseConsumer':
			{
				if (!peer.data.joined) { throw new Error('Peer yet to joined.'); }

				const { consumerId } = request.data;
				const consumer = peer.data.consumers.get(consumerId);

				if (!consumer) { throw new Error(`Consumer with id "${ consumerId }" not found.`); }

				await consumer.pause();

				accept(null);

				break;
			}

			case 'resumeConsumer':
			{
				if (!peer.data.joined) { throw new Error('Peer yet to joined'); }

				const { consumerId } = request.data;
				const consumer = peer.data.consumers.get(consumerId);

				if (!consumer) { throw new Error(`Consumer with id "${ consumerId }" not found.`); }

				await consumer.resume();

				accept(null);

				break;
			}
		}
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
