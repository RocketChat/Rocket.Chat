import { IVoipExtensionConfig, IVoipExtensionBase, IQueueMembershipDetails, IRegistrationInfo } from './IVoipExtension';
import { IQueueDetails, IQueueSummary } from './ACDQueues';

export interface IVoipConnectorResult {
	result: IVoipExtensionConfig | IVoipExtensionBase[] | IQueueSummary[] | IQueueDetails | IQueueMembershipDetails | IRegistrationInfo;
}
