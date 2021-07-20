import { Emitter } from '@rocket.chat/emitter';
import { useSubscription } from 'use-subscription';

// import { useUserRoom } from '../../../client/contexts/UserContext';

import VoiceRoomClient from '.';
import { createVoiceClient } from './util';
import { IRoom } from '../../../definition/IRoom';

type WsConnectionState = 'wsconnecting' | 'wsconnected' | 'disconnecting' | 'disconnected' | 'updating-peers';
type MediasoupConnectionState = 'connecting' | 'connected' | 'updating-peers';

type ConnectionState = MediasoupConnectionState | 'notStarted' | 'error' | WsConnectionState;

type InitialState = {
	state: 'notStarted';
}

type WsState = {
	state: WsConnectionState;
	rid: string;
	wsClient: VoiceRoomClient;
}

type MediasoupState = {
	state: MediasoupConnectionState;
	rid: string;
	mediasoupClient: VoiceRoomClient;
	wsClient: VoiceRoomClient | null;
}

type ErrorState = {
	state: 'error';
	err: any;
}

type State = InitialState | MediasoupState | ErrorState | WsState;

export const isMediasoupState = (state: State): state is MediasoupState =>
	['connected', 'connecting'].includes(state.state);

export const isWsState = (state: State): state is WsState =>
	['wsconnecting', 'wsconnected', 'disconnecting', 'disconnected'].includes(state.state);

export class VoiceRoomManager extends Emitter<{
	'click': undefined;
	'change': ConnectionState | 'peer-change';
}> {
	public state: State = {
		state: 'notStarted',
	}

	constructor() {
		super();
	}

	public setState(state: ConnectionState): void {
		this.state.state = state;
		this.emit('change', state);
	}

	private setWsState(state: WsState, rid: string): void {
		this.state = {
			state: state.state,
			rid,
			wsClient: state.wsClient,
		};
		this.emit('change', state.state);
	}

	private async connectWsClient(): Promise<void> {
		try {
			if (isWsState(this.state) || isMediasoupState(this.state)) {
				if (this.state.wsClient) {
					// addListenersToClient(this.state.wsClient, t);
					await this.state.wsClient.join();
				}

				if (this.state.state === 'wsconnecting') {
					this.setState('wsconnected');
				}
			}
		} catch (err) {
			console.log(err);
		}
	}

	private setMediasoupState(state: WsState): void {
		this.state = {
			state: 'connecting',
			rid: state.rid,
			mediasoupClient: state.wsClient,
			wsClient: null,
		};

		this.emit('change', 'connecting');
	}

	public connect(rid: string, room: IRoom): void {
		const wsClient = createVoiceClient(room);
		// wsClient.on('peer-change', () => {
		// 	if (this.state.state === 'connected') {
		// 		this.setState('updating-peers');
		// 		this.setState('connected');
		// 	}
		// });
		// fix connection when changing rooms
		if (isMediasoupState(this.state)) {
			this.state.wsClient = wsClient;
		} else {
			this.setWsState({ rid, state: 'wsconnecting', wsClient }, rid);
		}

		this.connectWsClient();
	}

	private async connectMediasoupClient(): Promise<void> {
		try {
			if (isWsState(this.state)) {
				this.setMediasoupState(this.state);
			}

			if (this.state.state === 'connecting') {
				await this.state.mediasoupClient.joinRoom();
				this.setState('connected');
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

	public disconnect(rid: string, room: IRoom): void {
		if (isMediasoupState(this.state)) {
			this.state.mediasoupClient.close();
			this.setState('disconnected');
			this.connect(rid, room);
		}
	}
}
const manager = new VoiceRoomManager();

const query = {
	getCurrentValue: (): State => manager.state,
	subscribe: (callback: () => void): (() => void) => {
		const stop = manager.on('change', callback);
		return (): void => {
			console.log('stopped');
			stop();
		};
	},
};

export const useVoiceChannel = (): State => {
	const voiceManagerState = useSubscription(query);
	return voiceManagerState;
};

export default manager;

// export const SideBarVoiceChannel: FC = () => {
// 	const meta = useVoiceChannelMeta();

// 	console.log(meta);

// 	if (!isMeta(meta)) {
// 		return null;
// 	}

// 	return <SideBarVoiceChannelRoom rid={meta.rid} meta={meta}/>;
// };

// export const SideBarVoiceChannelRoom: FC<{ rid: string; meta: Meta }> = ({ rid, meta }) => {
// 	const room = useUserRoom(rid);

// 	const fn = useCallback(() => {
// 		v.disconnect();
// 	}, []);

// 	if (!room) {
// 		return null;
// 	}


// 	return <Button onClick={fn}>{JSON.stringify(room.name || room.fname)} {meta.state}</Button>;
// };


// export const VoiceChannelButton: FC = () => {
// 	const meta = useVoiceChannelMeta();

// 	const fn = useCallback(() => {
// 		if (['notStarted', 'disconnected'].includes(meta.state)) {
// 			return v.connect('GENERAL');
// 		}
// 		v.disconnect();
// 	}, [meta]);

// 	return <Button onClick={fn}>Here {meta.state}</Button>;
// };
