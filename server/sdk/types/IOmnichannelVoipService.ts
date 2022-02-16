import { FindOneOptions } from 'mongodb';

import { IAgentExtensionMap, IRoomCreationResponse } from '../../../definition/IOmnichannelVoipServiceResult';
import { ILivechatVisitor } from '../../../definition/ILivechatVisitor';
import { IVoipRoom, IRoom } from '../../../definition/IRoom';
import { VoipClientEvents } from '../../../definition/voip/VoipClientEvents';
import { IUser } from '../../../definition/IUser';
import { IVoipExtensionWithAgentInfo } from '../../../definition/IVoipExtension';

export interface IOmnichannelVoipService {
	getConfiguration(): any;
	getFreeExtensions(): Promise<string[]>;
	getExtensionAllocationDetails(): Promise<IAgentExtensionMap[]>;
	getNewRoom(
		guest: ILivechatVisitor,
		agent: { agentId: string; username: string },
		rid: string,
		options: FindOneOptions<IVoipRoom>,
	): Promise<IRoomCreationResponse>;
	findRoom(token: string, rid: string): Promise<IVoipRoom | null>;
	closeRoom(visitor: ILivechatVisitor, room: IVoipRoom): Promise<boolean>;
	handleEvent(event: VoipClientEvents, room: IRoom, user: IUser, comment?: string): Promise<void>;
	getExtensionListWithAgentData(): Promise<IVoipExtensionWithAgentInfo[]>;
}
