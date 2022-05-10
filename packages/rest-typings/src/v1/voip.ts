import type {
	IQueueSummary,
	ILivechatAgent,
	IVoipRoom,
	IUser,
	IQueueMembershipDetails,
	IQueueMembershipSubscription,
	IVoipExtensionWithAgentInfo,
	IManagementServerConnectionStatus,
	IRegistrationInfo,
	VoipClientEvents,
} from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type VoipEndpoints = {
	'/v1/connector.extension.getRegistrationInfoByUserId': {
		GET: (params: { id: string }) => IRegistrationInfo | { result: string };
	};
	'/v1/voip/queues.getSummary': {
		GET: () => { summary: IQueueSummary[] };
	};
	'/v1/voip/queues.getQueuedCallsForThisExtension': {
		GET: (params: { extension: string }) => IQueueMembershipDetails;
	};
	'/v1/voip/queues.getMembershipSubscription': {
		GET: (params: { extension: string }) => IQueueMembershipSubscription;
	};
	'/v1/omnichannel/extensions': {
		GET: (
			params: PaginatedRequest<{ status?: string; agentId?: string; queues?: string[]; extension?: string }>,
		) => PaginatedResult<{ extensions: IVoipExtensionWithAgentInfo[] }>;
	};
	'/v1/omnichannel/extension': {
		GET: (
			params: { userId: string; type: 'free' | 'allocated' | 'available' } | { username: string; type: 'free' | 'allocated' | 'available' },
		) => {
			extensions: string[];
		};
	};
	'/v1/omnichannel/agent/extension': {
		GET: (params: { username: string }) => { extension: Pick<IUser, '_id' | 'username' | 'extension'> };
		POST: (params: { userId: string; extension: string } | { username: string; extension: string }) => void;
		DELETE: (params: { username: string }) => void;
	};
	'/v1/omnichannel/agents/available': {
		GET: (params: PaginatedRequest<{ text?: string; includeExtension?: string }>) => PaginatedResult<{ agents: ILivechatAgent[] }>;
	};
	'/v1/voip/events': {
		POST: (params: { event: VoipClientEvents; rid: string; comment?: string }) => void;
	};
	'/v1/voip/room': {
		GET: (params: { token: string; agentId: ILivechatAgent['_id'] } | { rid: string; token: string }) => {
			room: IVoipRoom;
			newRoom: boolean;
		};
	};
	'/v1/voip/managementServer/checkConnection': {
		GET: (params: { host: string; port: string; username: string; password: string }) => IManagementServerConnectionStatus;
	};
	'/v1/voip/callServer/checkConnection': {
		GET: (params: { websocketUrl: string; host: string; port: string; path: string }) => IManagementServerConnectionStatus;
	};
	'/v1/voip/rooms': {
		GET: (params: {
			agents?: string[];
			open?: boolean;
			createdAt?: string;
			closedAt?: string;
			tags?: string[];
			queue?: string;
			visitorId?: string;
		}) => PaginatedResult<{ rooms: IVoipRoom[] }>;
	};
	'/v1/voip/room.close': {
		POST: (params: { rid: string; token: string; comment: string; tags?: string[] }) => { rid: string };
	};
};
