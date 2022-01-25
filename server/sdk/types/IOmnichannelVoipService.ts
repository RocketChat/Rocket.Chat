import { FindOneOptions } from 'mongodb';

import { IAgentExtensionMap, IRoomCreationResponse } from '../../../definition/IOmnichannelVoipServiceResult';
import { ILivechatVisitor } from '../../../definition/ILivechatVisitor';
import { IVoipRoom } from '../../../definition/IRoom';

export interface IOmnichannelVoipService {
	getConfiguration(): any;
	getFreeExtensions(): Promise<string[]>;
	getExtensionAllocationDetails(): Promise<IAgentExtensionMap[]>;
	findAgent(agentId: string): Promise<any>;
	getNewRoom(
		guest: ILivechatVisitor,
		agent: any,
		rid: string,
		roomInfo: any,
		options: FindOneOptions<IVoipRoom>,
	): Promise<IRoomCreationResponse>;
	findRoom(token: string, rid: string): Promise<IVoipRoom | null>;
	closeRoom(visitor: ILivechatVisitor, room: IVoipRoom, options: any): Promise<boolean>;
}
