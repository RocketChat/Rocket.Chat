import { IQueueSummary } from '../../ACDQueues';
import { IQueueMembershipDetails, IVoipExtensionWithAgentInfo } from '../../IVoipExtension';
import { IRegistrationInfo } from '../../voip/IRegistrationInfo';
import { PaginatedRequest } from '../helpers/PaginatedRequest';
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
		GET: (params: PaginatedRequest) => PaginatedResult & { extensions: IVoipExtensionWithAgentInfo[] };
	};
	'omnichannel/extension': {
		GET: (
			params: { userId: string; type: string } | { username: string; type: string },
		) => PaginatedResult & { extensions?: string[]; available?: string[] }; // TODO: check how to do conditional types when the type param changes
	};
	'omnichannel/agent/extension': {
		POST: (params: { userId: string; extension: string } | { username: string; extension: string }) => void;
		DELETE: (params: { username: string }) => void;
	};
};
