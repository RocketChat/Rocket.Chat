import { FindOneOptions } from 'mongodb';

import { IAgentExtensionMap, IRoomCreationResponse } from '../../../definition/IOmnichannelVoipServiceResult';
import { ILivechatVisitor } from '../../../definition/ILivechatVisitor';
import { IVoipRoom, IRoom } from '../../../definition/IRoom';
import { VoipClientEvents } from '../../../definition/voip/VoipClientEvents';
import { IUser } from '../../../definition/IUser';
import { IVoipExtensionWithAgentInfo } from '../../../definition/IVoipExtension';
import { FindVoipRoomsParams } from '../../services/omnichannel-voip/internalTypes';
import { PaginatedResult } from '../../../definition/rest/helpers/PaginatedResult';

export interface IOmnichannelVoipService {
	getConfiguration(): any;
	getFreeExtensions(): Promise<string[]>;
	getExtensionAllocationDetails(): Promise<IAgentExtensionMap[]>;
	getNewRoom(
		guest: ILivechatVisitor,
		agent?: { agentId: string; username: string },
		rid: string,
		options: FindOneOptions<IVoipRoom>,
	): Promise<IRoomCreationResponse>;
	findRoom(token: string, rid: string): Promise<IVoipRoom | null>;
	closeRoom(visitor: ILivechatVisitor, room: IVoipRoom, user: IUser, comment?: string, tags?: string[]): Promise<boolean>;
	handleEvent(event: VoipClientEvents, room: IRoom, user: IUser, comment?: string): Promise<void>;
	getExtensionListWithAgentData(): Promise<IVoipExtensionWithAgentInfo[]>;
	findVoipRooms(filter: FindVoipRoomsParams): Promise<PaginatedResult<{ rooms: IVoipRoom[] }>>;
}
