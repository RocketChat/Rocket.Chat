import type {
	IAgentExtensionMap,
	IRoomCreationResponse,
	ILivechatVisitor,
	IRoom,
	IUser,
	IVoipExtensionWithAgentInfo,
	ILivechatAgent,
	VoipClientEvents,
	IVoipRoom,
} from '@rocket.chat/core-typings';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import type { FindOptions } from 'mongodb';

export type FindVoipRoomsParams = {
	agents?: string[];
	open?: boolean;
	createdAt?: { start?: string; end?: string };
	closedAt?: { start?: string; end?: string };
	tags?: string[];
	queue?: string;
	visitorId?: string;
	options?: {
		sort?: FindOptions<IVoipRoom>['sort'];
		count?: number;
		fields?: Record<string, unknown>;
		offset?: number;
	};
	direction?: IVoipRoom['direction'];
	roomName?: string;
};

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
