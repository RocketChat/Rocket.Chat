import type { IVoipExtensionConfig, IVoipExtensionBase, IQueueMembershipDetails, IQueueMembershipSubscription } from './IVoipExtension';
import type { IQueueDetails, IQueueSummary } from './ACDQueues';
import type { IRegistrationInfo } from './voip';

export interface IVoipConnectorResult {
	result:
		| IVoipExtensionConfig
		| IVoipExtensionBase[]
		| IQueueSummary[]
		| IQueueDetails
		| IQueueMembershipDetails
		| IQueueMembershipSubscription
		| IRegistrationInfo
		| undefined;
}
