import VoiceRoomClient from '.';

type WsConnectionState = 'wsconnecting' | 'wsconnected' | 'disconnecting' | 'disconnected' | 'updating-peers';
type MediasoupConnectionState = 'connecting' | 'connected' | 'updating-peers';

export type ConnectionState = MediasoupConnectionState | 'notStarted' | 'error' | WsConnectionState;

export type InitialState = {
	state: 'notStarted';
}

export type WsState = {
	state: WsConnectionState;
	rid: string;
	wsClient: VoiceRoomClient;
}

export type MediasoupState = {
	state: MediasoupConnectionState;
	rid: string;
	mediasoupClient: VoiceRoomClient;
	wsClient: VoiceRoomClient | null;
}

export type ErrorState = {
	state: 'error';
	err: any;
}

export type State = InitialState | MediasoupState | ErrorState | WsState;
