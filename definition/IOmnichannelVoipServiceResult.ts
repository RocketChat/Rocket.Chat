import { IVoipRoom } from './IRoom';

export interface IAgentExtensionMap {
	_id: string;
	agentName: string;
	extension: string;
}

export interface IRoomCreationResponse {
	newRoom: boolean;
	room: IVoipRoom;
}
export interface IOmnichannelVoipServiceResult {
	result: string[] | IAgentExtensionMap[] | IRoomCreationResponse | IVoipRoom | boolean | null;
}
