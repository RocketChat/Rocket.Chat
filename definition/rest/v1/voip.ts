import { IQueueSummary } from '../../ACDQueues';
import { ILivechatAgent } from '../../ILivechatAgent';
import { IVoipRoom } from '../../IRoom';
import { IQueueMembershipDetails, IVoipExtensionWithAgentInfo } from '../../IVoipExtension';
import { IRegistrationInfo } from '../../voip/IRegistrationInfo';
import { VoipClientEvents } from '../../voip/VoipClientEvents';
import { PaginatedResult } from '../helpers/PaginatedResult';

export type VoipEndpoints = {
	'connector.extension.getRegistrationInfoByUserId': {
		GET: (params: { id: string }) => IRegistrationInfo;
	};
	'voip/queues.getSummary': {
		GET: () => { summary: IQueueSummary[] };
	};
	'voip/queues.getQueuedCallsForThisExtension': {
		GET: (params: { extension: string }) => IQueueMembershipDetails;
	};
	'omnichannel/extensions': {
		GET: () => PaginatedResult<{ extensions: IVoipExtensionWithAgentInfo[] }>;
	};
	'voip/events': {
		POST: (params: { event: VoipClientEvents; rid: string; comment?: string }) => void;
	};
	'voip/room': {
		GET: (params: { token: string; agentId: ILivechatAgent['_id'] }) => { room: IVoipRoom; newRoom: boolean };
	};
	'voip/rooms': {
		GET: (params: {
			agents: string[];
			open: boolean;
			createdAt: string;
			closedAt: string;
			tags: string[];
			queue: string;
			visitorId: string;
		}) => PaginatedResult<{ rooms: IVoipRoom[] }>;
	};
	'voip/room.close': {
		POST: (params: { rid: string; token: string; comment: string; tags?: string[] }) => { rid: string };
	};
};
