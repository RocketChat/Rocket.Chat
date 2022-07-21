import { FindOptions } from 'mongodb';
import type {
	IAgentExtensionMap,
	IRoomCreationResponse,
	ILivechatVisitor,
	IVoipRoom,
	IRoom,
	IUser,
	IVoipExtensionWithAgentInfo,
	ILivechatAgent,
} from '@rocket.chat/core-typings';
import { VoipClientEvents } from '@rocket.chat/core-typings';
import type { PaginatedResult } from '@rocket.chat/rest-typings';

import { FindVoipRoomsParams } from '../../services/omnichannel-voip/internalTypes';

export interface IOmnichannelVoipService {
	getFreeExtensions(): Promise<string[]>;
	getExtensionAllocationDetails(): Promise<IAgentExtensionMap[]>;
	getNewRoom(
		guest: ILivechatVisitor,
		agent: { agentId: string; username: string },
		rid: string,
		direction: IVoipRoom['direction'],
		options: FindOptions<IVoipRoom>,
	): Promise<IRoomCreationResponse>;
	findRoom(token: string, rid: string): Promise<IVoipRoom | null>;
	closeRoom(
		closer: ILivechatVisitor | ILivechatAgent,
		room: IVoipRoom,
		user: IUser,
		sysMessageId?: 'voip-call-wrapup' | 'voip-call-ended-unexpectedly',
		options?: { comment?: string | null; tags?: string[] | null },
	): Promise<boolean>;
	handleEvent(
		event: VoipClientEvents,
		room: IRoom,
		user: IUser,
		comment?: string,
		sysMessageId?: 'voip-call-wrapup' | 'voip-call-ended-unexpectedly',
	): Promise<void>;
	getExtensionListWithAgentData(): Promise<IVoipExtensionWithAgentInfo[]>;
	findVoipRooms(filter: FindVoipRoomsParams): Promise<PaginatedResult<{ rooms: IVoipRoom[] }>>;
	getAvailableAgents(
		includeExtension?: string,
		text?: string,
		count?: number,
		offset?: number,
		sort?: Record<string, unknown>,
	): Promise<{ agents: ILivechatAgent[]; total: number }>;
}
