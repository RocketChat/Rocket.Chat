import type { IVoipRoom } from './Room';

export interface IAgentExtensionMap {
	_id: string;
	agentName: string;
	extension: string;
}

export interface IRoomCreationResponse {
	newRoom: boolean;
	room: IVoipRoom;
}
