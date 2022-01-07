import { IOmnichannelVoipServiceResult } from '../../../definition/IOmnichannelVoipServiceResult';
import { ILivechatVisitor } from '../../../definition/ILivechatVisitor';
import { IVoipRoom } from '../../../definition/IRoom';

export interface IOmnichannelVoipService {
	getConfiguration(): any;
	getFreeExtensions(): Promise<IOmnichannelVoipServiceResult> ;
	getExtensionAllocationDetails(): Promise<IOmnichannelVoipServiceResult>;
	findAgent(agentId: string): Promise<any>;
	getNewRoom(guest: ILivechatVisitor, agent: any, rid: string, roomInfo: any): Promise<IOmnichannelVoipServiceResult>;
	findRoom(token: string, rid: string): Promise<IOmnichannelVoipServiceResult>;
	closeRoom(visitor: ILivechatVisitor, room: IVoipRoom, options: any): Promise<IOmnichannelVoipServiceResult>;
}
