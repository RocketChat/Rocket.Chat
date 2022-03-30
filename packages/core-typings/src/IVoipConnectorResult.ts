import type {
	IVoipExtensionConfig,
	IVoipExtensionBase,
	IQueueMembershipDetails,
	IRegistrationInfo,
	IQueueMembershipSubscription,
} from './IVoipExtension';
import type { IQueueDetails, IQueueSummary } from './ACDQueues';

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
