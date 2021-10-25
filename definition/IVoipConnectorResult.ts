import { IVoipExtensionConfig, IVoipExtensionBase } from './IVoipExtension';
import { IQueueDetails, IQueueSummary } from './ACDQueues';

export interface IVoipConnectorResult {
	result: IVoipExtensionConfig | IVoipExtensionBase [] | IQueueSummary [] | IQueueDetails;
}
