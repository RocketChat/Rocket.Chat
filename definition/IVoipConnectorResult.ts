import { IVoipExtensionConfig, IVoipExtensionBase, IQueueMembershipDetails, IRegistrationInfo } from './IVoipExtension';
import { IQueueDetails, IQueueSummary, ISourceQueueDetails } from './ACDQueues';

export interface IVoipConnectorResult {
	result:
		| IVoipExtensionConfig
		| IVoipExtensionBase[]
		| IQueueSummary[]
		| IQueueDetails
		| IQueueMembershipDetails
		| IRegistrationInfo
		| ISourceQueueDetails
		| undefined;
}
