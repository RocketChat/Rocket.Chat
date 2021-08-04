export interface IVoiceRoomPeer {
	id: string;
	track?: MediaStreamTrack;
	displayName?: string;
	device?: object;
	consumerId?: string;
	username?: string;
	deafen?: boolean;
	disableDeafenControls?: boolean;
}
