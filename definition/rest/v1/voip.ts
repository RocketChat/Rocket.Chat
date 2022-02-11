import { IQueueSummary } from '../../ACDQueues';
import { IQueueMembershipDetails, IVoipExtensionWithAgentInfo } from '../../IVoipExtension';
import { IRegistrationInfo } from '../../voip/IRegistrationInfo';
import { PaginatedResult } from '../helpers/PaginatedResult';
import { VoipClientEvents } from '../../voip/VoipClientEvents';

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
};
