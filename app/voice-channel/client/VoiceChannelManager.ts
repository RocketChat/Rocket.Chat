import { Emitter } from '@rocket.chat/emitter';
import { useSubscription } from 'use-subscription';

import { ConnectionState, ErrorState, InitialState, MediasoupState, State, WsState } from './types';
import { createVoiceClient } from './util';
import { IRoom } from '../../../definition/IRoom';
import { IVoiceRoomPeer } from '../../../definition/IVoiceRoomPeer';

export const isMediasoupState = (state: State): state is MediasoupState =>
	['connected', 'connecting'].includes(state.state);

export const isWsState = (state: State): state is WsState =>
	['wsconnecting', 'wsconnected', 'disconnecting', 'disconnected'].includes(state.state);

export const isInitialState = (state: State): state is InitialState => state.state === 'notStarted';

export const isErrorState = (state: State): state is ErrorState => state.state === 'error';

export class VoiceRoomManager extends Emitter<{
	'change': ConnectionState;
	'mediasoup-peer-change': undefined;
	'ws-peer-change': undefined;
	'toggle-mic': undefined;
	'toggle-deafen': undefined;
}> {
	public state: State = {
		state: 'notStarted',
	}

	public mediasoupPeers: Array<IVoiceRoomPeer> = [];

	public wsPeers: Array<IVoiceRoomPeer> = [];

	public muted = false;

	public deafen = false;

	constructor() {
		super();
	}

	private setMuted(value: boolean): void {
		this.muted = value;
		this.emit('toggle-mic');
	}


	private setDeafen(value: boolean): void {
		this.deafen = value;
		this.emit('toggle-deafen');
	}

	private setMediasoupPeers(peers: Array<IVoiceRoomPeer>): void {
		this.mediasoupPeers = [...peers];
		this.emit('mediasoup-peer-change');
	}

	private setWsPeers(peers: Array<IVoiceRoomPeer>): void {
		this.wsPeers = [...peers];
		this.emit('ws-peer-change');
	}

	public setState(state: State): void {
		this.state = {
			...state,
		};
		this.emit('change', state.state);
	}

	private async connectWsClient(): Promise<void> {
		try {
			if (isWsState(this.state)) {
				await this.state.wsClient.join();
			}

			if (isMediasoupState(this.state)) {
				if (this.state.wsClient) {
					await this.state.wsClient.join();
				}
			}
		} catch (err) {
			console.log(err);
		}
	}

	public connect(rid: string, room: IRoom): void {
		if (isWsState(this.state)) {
			this.state.wsClient.close();
		}

		const wsClient = createVoiceClient(room);

		wsClient.on('peer-change', () => {
			if (isMediasoupState(this.state)) {
				this.setMediasoupPeers(this.state.mediasoupClient.peers);
			}
			if (isWsState(this.state) || isMediasoupState(this.state)) {
				if (this.state.wsClient) {
					this.setWsPeers(this.state.wsClient.peers);
				}
			}
		});

		wsClient.on('error', (err) => {
			this.setState({
				state: 'error',
				err,
			});
		});

		wsClient.on('wsconnected', () => {
			if (this.state.state === 'wsconnecting') {
				this.setState({
					...this.state,
					state: 'wsconnected',
				});
			}
		});

		wsClient.on('connected', () => {
			if (this.state.state === 'connecting') {
				this.setState({
					...this.state,
					state: 'connected',
				});
			}
		});

		// fix connection when changing rooms
		if (isMediasoupState(this.state)) {
			if (this.state.rid !== rid) {
				this.setState({
					...this.state,
					wsClient,
				});
				this.connectWsClient();
			} else if (this.state.wsClient) {
				wsClient.closeProtoo();
				this.setWsPeers([]);
				this.setState({ ...this.state, wsClient: null });
			}
		} else {
			this.setState({ rid, state: 'wsconnecting', wsClient });
			this.connectWsClient();
		}
	}

	private async connectMediasoupClient(): Promise<void> {
		try {
			if (isWsState(this.state)) {
				this.setState({
					state: 'connecting',
					rid: this.state.rid,
					mediasoupClient: this.state.wsClient,
					wsClient: null,
				});
			}

			if (this.state.state === 'connecting') {
				await this.state.mediasoupClient.joinRoom();
			}
		} catch (err) {
			console.log(err);
		}
	}

	public joinRoom(rid: string): void {
		if (this.state.state === 'wsconnected' && this.state.rid === rid) {
			this.connectMediasoupClient();
		}
	}

	public disconnect(): void {
		if (isMediasoupState(this.state)) {
			this.state.mediasoupClient.close();
			if (this.state.wsClient) {
				this.state.wsClient.close();
			}
			this.setState({
				rid: this.state.rid,
				wsClient: this.state.mediasoupClient,
				state: 'disconnected',
			});
			this.setState({
				state: 'notStarted',
			});
			this.setMediasoupPeers([]);
			this.setMuted(false);
			this.setDeafen(false);
		}
	}

	public async toggleMic(): Promise<void> {
		if (isMediasoupState(this.state)) {
			try {
				const state = await this.state.mediasoupClient.toggleMic();
				this.setMuted(state);
			} catch (err) {
				console.log(err);
			}
		}
	}

	public toggleDeafen(): void {
		if (isMediasoupState(this.state)) {
			const state = this.state.mediasoupClient.toggleDeafen();
			this.setDeafen(state);
		}
	}
}
const manager = new VoiceRoomManager();

const query = {
	getCurrentValue: (): State => manager.state,
	subscribe: (callback: () => void): (() => void) => {
		const stop = manager.on('change', callback);
		return (): void => {
			stop();
		};
	},
};

export const useVoiceChannel = (): State => {
	const voiceManagerState = useSubscription(query);
	return voiceManagerState;
};

const mediasoupPeersQuery = {
	getCurrentValue: (): Array<IVoiceRoomPeer> => manager.mediasoupPeers,
	subscribe: (callback: () => void): (() => void) => {
		const stop = manager.on('mediasoup-peer-change', callback);
		return (): void => {
			stop();
		};
	},
};

export const useMediasoupPeers = (): Array<IVoiceRoomPeer> => {
	const mediasoupPeersState = useSubscription(mediasoupPeersQuery);
	return mediasoupPeersState;
};


const wsPeersQuery = {
	getCurrentValue: (): Array<IVoiceRoomPeer> => manager.wsPeers,
	subscribe: (callback: () => void): (() => void) => {
		const stop = manager.on('ws-peer-change', callback);
		return (): void => {
			stop();
		};
	},
};

export const useWsPeers = (): Array<IVoiceRoomPeer> => {
	const wsPeersState = useSubscription(wsPeersQuery);
	return wsPeersState;
};

const toggleMicQuery = {
	getCurrentValue: (): boolean => manager.muted,
	subscribe: (callback: () => void): (() => void) => {
		const stop = manager.on('toggle-mic', callback);
		return (): void => {
			stop();
		};
	},
};

export const useVoiceChannelMic = (): boolean => useSubscription(toggleMicQuery);

const toggleDeafenQuery = {
	getCurrentValue: (): boolean => manager.deafen,
	subscribe: (callback: () => void): (() => void) => {
		const stop = manager.on('toggle-deafen', callback);
		return (): void => {
			stop();
		};
	},
};

export const useVoiceChannelDeafen = (): boolean => useSubscription(toggleDeafenQuery);

export default manager;
