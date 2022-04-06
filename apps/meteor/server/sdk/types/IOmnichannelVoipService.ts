import { FindOneOptions } from 'mongodb';

import type { IAgentExtensionMap, IRoomCreationResponse } from '@rocket.chat/core-typings';
import type { ILivechatVisitor } from '@rocket.chat/core-typings';
import type { IVoipRoom, IRoom } from '@rocket.chat/core-typings';
import { VoipClientEvents } from '@rocket.chat/core-typings';
import type { IUser } from '@rocket.chat/core-typings';
import type { IVoipExtensionWithAgentInfo } from '@rocket.chat/core-typings';
import { FindVoipRoomsParams } from '../../services/omnichannel-voip/internalTypes';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import type { ILivechatAgent } from '@rocket.chat/core-typings';

export interface IOmnichannelVoipService {
	getFreeExtensions(): Promise<string[]>;
	getExtensionAllocationDetails(): Promise<IAgentExtensionMap[]>;
	getNewRoom(
		guest: ILivechatVisitor,
		agent: { agentId: string; username: string },
		rid: string,
		options: FindOneOptions<IVoipRoom>,
	): Promise<IRoomCreationResponse>;
	findRoom(token: string, rid: string): Promise<IVoipRoom | null>;
	closeRoom(closer: ILivechatVisitor | ILivechatAgent, room: IVoipRoom, user: IUser, comment?: string, tags?: string[]): Promise<boolean>;
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
