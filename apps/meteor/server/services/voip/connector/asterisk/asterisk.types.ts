import type { IExtensionDetails, IQueueDetails, ACDQueueInfo } from '@rocket.chat/core-typings';

export type AmiCommand = {
	action?: 'queuesummary' | 'queuestatus' | 'pjsipshowendpoints' | 'pjsipshowendpoint';
	queue?: string;
	endpoint?: string;
};

/**
 * This class serves as a a base class for the different kind of call server objects
 * @remarks
 */
export enum CommandType {
	ARI,
	AMI,
	AGI,
}

export type ACDCommandResult = { queueSummary?: ACDQueueInfo[]; queueStatus?: IQueueDetails };
export type CommandParams = {
	queueName?: string;
	extension?: string;
};

export type PJSIPCommandResult = {
	endpoints?: IExtensionDetails[];
	endpoint?: IExtensionDetails;
};
