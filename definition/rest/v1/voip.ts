import { IQueueSummary, ISourceQueueDetails } from '../../ACDQueues';
import { IQueueMembershipDetails } from '../../IVoipExtension';
import { IRegistrationInfo } from '../../voip/IRegistrationInfo';

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
	'voip/queues.getSourceQueueDetails': {
		GET: (params: { extension: string }) => { details: ISourceQueueDetails };
	};
};
