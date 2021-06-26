import { EventEmitter } from 'events';

import { Peer, WebSocketTransport } from 'protoo-client';
import { Device, types } from 'mediasoup-client';

import { IPeer } from '../../../sfu/types';

interface IData {
	roomID: string;
	peerID: string;
	device: object;
	produce: boolean;
	consume: boolean;
	displayName: string;
	username?: string;
	roomName: string;
}

export default class VoiceRoom extends EventEmitter {
	roomID: string;

	roomName: string;

	closed: boolean;

	joined: boolean;

	displayName: string;

	device: object;

	produce: boolean;

	consume: boolean;

	protooUrl: string;

	username?: string;

	protoo?: Peer;

	mediasoupDevice?: types.Device;

	sendTransport?: types.Transport;

	recvTransport?: types.Transport;

	micProducer?: types.Producer;

	consumers: Map<string, types.Consumer>;

	constructor({ roomID, device, produce, consume, displayName, peerID, username, roomName }: IData) {
		super();
		this.roomID = roomID;
		this.device = device;
		this.displayName = displayName;
		this.closed = false;
		this.produce = produce;
		this.consume = consume;
		this.protooUrl = `ws://${ window.location.hostname }:8989/?roomId=${ roomID }&peerId=${ peerID }`;
		this.consumers = new Map();
		this.username = username;
		this.joined = false;
		this.roomName = roomName;
	}

	closeProtoo(): void {
		this.protoo?.close();
	}

	async join(): Promise<void> {
		const protooTransport = new WebSocketTransport(this.protooUrl);
		this.protoo = new Peer(protooTransport);

		this.protoo.on('open', async () => {
			this.emit('connectionOpened');
			const peers: Array<IPeer> =	await this.protoo?.request('join', {
				displayName: this.displayName,
				device: this.device,
				username: this.username,
				joined: false,
			});
			this.emit('allJoinedPeers', peers);
		});

		this.protoo.on('disconnected', () => {
			if (this.sendTransport) {
				this.sendTransport.close();
				this.sendTransport = undefined;
			}

			if (this.recvTransport) {
				this.recvTransport.close();
				this.recvTransport = undefined;
			}
		});

		this.protoo.on('close', () => this.close());

		this.protoo.on('request', async (request, accept, reject) => {
			switch (request.method) {
				// Event triggered when new peer/consumer joins the room
				case 'newConsumer':
				{
					if (!this.consume) {
						reject(403, 'I do not want to consume');

						break;
					}

					const {
						peerID,
						producerID,
						id,
						kind,
						rtpParameters,
						appData,
					} = request.data;

					try {
						const consumer = await this.recvTransport?.consume(
							{
								id,
								producerId: producerID,
								kind,
								rtpParameters,
								appData: { ...appData, peerId: peerID },
							});

						if (consumer) {
							this.consumers.set(consumer.id, consumer);

							const peer = await this.protoo?.request('getPeer', peerID);
							this.emit('newConsumer', consumer, peerID, peer);

							consumer.on('transportclose', () => {
								this.consumers.delete(consumer.id);
							});
						}


						accept();
					} catch (error) {
						console.log(error);
						reject(error);
					}

					break;
				}
			}
		});

		this.protoo.on('notification', (notif) => {
			switch (notif.method) {
				// Event triggered when peer disconnects
				case 'peerClosed': {
					this.emit('peerClosed', notif.data.peerId);
					break;
				}
				// Event triggered only when new peer joins & current peer hasnt joined the room
				case 'peerJoined': {
					this.emit('peerJoined', notif.data);
				}
			}
		});
	}

	close(): void {
		if (this.closed) {
			return;
		}

        this.protoo?.close();
        this.sendTransport?.close();
        this.recvTransport?.close();
	}

	async joinRoom(): Promise<void> {
		try {
			this.joined = true;
			this.mediasoupDevice = new Device();

			const routerRtpCapabilities = await this.protoo?.request('getRouterRtpCapibilities');
			await this.mediasoupDevice.load({ routerRtpCapabilities });

			if (this.produce) {
				const transportInfo = await this.protoo?.request('createWebRtcTransport', { producing: true, consuming: false });

				const {
					id,
					iceParameters,
					iceCandidates,
					dtlsParameters,
					sctpParameters,
				} = transportInfo;

				this.sendTransport = this.mediasoupDevice.createSendTransport(
					{
						id,
						iceParameters,
						iceCandidates,
						dtlsParameters,
						sctpParameters,
						iceServers: [],
					});

				this.sendTransport.on('connect', ({ dtlsParameters }, cb, errback) => {
                    this.protoo?.request('connectWebRtcTransport', { transportId: this.sendTransport?.id, dtlsParameters })
                    .then(cb)
                    .catch(errback);
				});

				this.sendTransport.on(
					'produce', async ({ kind, rtpParameters, appData }, cb, errback) => {
						try {
							const { id } = await this.protoo?.request('produce', {
								transportId: this.sendTransport?.id,
								kind,
								rtpParameters,
								appData,
							});

							cb({ id });
						} catch (error) {
							errback(error);
						}
					});
			}

			if (this.consume) {
				const transportInfo = await this.protoo?.request('createWebRtcTransport', { producing: false, consuming: true });

				const {
					id,
					iceParameters,
					iceCandidates,
					dtlsParameters,
					sctpParameters,
				} = transportInfo;

				this.recvTransport = this.mediasoupDevice.createRecvTransport(
					{
						id,
						iceParameters,
						iceCandidates,
						dtlsParameters,
						sctpParameters,
						iceServers: [],
					});

				this.recvTransport.on(
					'connect', ({ dtlsParameters }, callback, errback) => {
						this.protoo?.request(
							'connectWebRtcTransport',
							{
								transportId: this.recvTransport?.id,
								dtlsParameters,
							})
							.then(callback)
							.catch(errback);
					});
			}

			const peerData = await this.protoo?.request('join', {
				displayName: this.displayName,
				device: this.device,
				rtpCapabilities: this.consume && this.mediasoupDevice.rtpCapabilities,
				username: this.username,
				joined: true,
			});
			this.emit('allJoinedPeers', peerData);

			if (this.produce) {
				this.enableMic();
			}
		} catch (err) {
			console.log(err);
		}
	}

	async enableMic(): Promise<void> {
		if (this.micProducer) {
			return;
		}

		if (!this.mediasoupDevice?.canProduce('audio')) {
			return;
		}

		let track: MediaStreamTrack;

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			track = stream.getAudioTracks()[0];

			this.micProducer = await this.sendTransport?.produce({
				track,
				codecOptions: {
					opusStereo: true,
					opusDtx: true,
				},
			});
		} catch (err) {
			console.log(err);
		}
	}

	async muteMic(): Promise<void> {
		this.micProducer?.pause();

		try {
			await this.protoo?.request('pauseProducer', { producerId: this.micProducer?.id });
		} catch (err) {
			console.log(err);
		}
	}

	async unmuteMic(): Promise<void> {
		this.micProducer?.resume();

		try {
			await this.protoo?.request('resumeProducer', { producerId: this.micProducer?.id });
		} catch (err) {
			console.log(err);
		}
	}
}
