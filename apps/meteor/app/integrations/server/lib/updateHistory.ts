import type { IIntegrationHistory, OutgoingIntegrationEvent, IIntegration, IMessage, AtLeast } from '@rocket.chat/core-typings';
import { IntegrationHistory } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';

import { omit } from '../../../../lib/utils/omit';

export const updateHistory = async ({
	historyId,
	step,
	integration,
	event,
	data,
	triggerWord,
	ranPrepareScript,
	prepareSentMessage,
	processSentMessage,
	resultMessage,
	finished,
	url,
	httpCallData,
	httpError,
	httpResult,
	error,
	errorStack,
}: {
	historyId: IIntegrationHistory['_id'];
	step: IIntegrationHistory['step'];
	integration?: IIntegration;
	event?: OutgoingIntegrationEvent;
	triggerWord?: string;
	ranPrepareScript?: boolean;
	prepareSentMessage?: { channel: string; message: Partial<IMessage> }[];
	processSentMessage?: { channel: string; message: Partial<IMessage> }[];
	resultMessage?: { channel: string; message: Partial<IMessage> }[];
	finished?: boolean;
	url?: string;
	httpCallData?: Record<string, any>; // ProcessedOutgoingRequest.data
	httpError?: any; // null or whatever error type `fetch` may throw
	httpResult?: string | null;

	error?: boolean;
	errorStack?: any; // Error | Error['stack']

	data?: Record<string, any>;
}) => {
	const { user: userData, room: roomData, ...fullData } = data || {};

	const history: AtLeast<IIntegrationHistory, 'type' | 'step'> = {
		type: 'outgoing-webhook',
		step,

		// Usually is only added on initial insert
		...(integration ? { integration } : {}),
		// Usually is only added on initial insert
		...(event ? { event } : {}),
		...(fullData
			? {
					data: {
						...fullData,
						...(userData ? { user: omit(userData, 'services') } : {}),
						...(roomData ? { room: roomData } : {}),
					},
			  }
			: {}),
		...(triggerWord ? { triggerWord } : {}),
		...(typeof ranPrepareScript !== 'undefined' ? { ranPrepareScript } : {}),
		...(prepareSentMessage ? { prepareSentMessage } : {}),
		...(processSentMessage ? { processSentMessage } : {}),
		...(resultMessage ? { resultMessage } : {}),
		...(typeof finished !== 'undefined' ? { finished } : {}),
		...(url ? { url } : {}),
		...(typeof httpCallData !== 'undefined' ? { httpCallData } : {}),
		...(httpError ? { httpError } : {}),
		...(typeof httpResult !== 'undefined' ? { httpResult: JSON.stringify(httpResult, null, 2) } : {}),
		...(typeof error !== 'undefined' ? { error } : {}),
		...(typeof errorStack !== 'undefined' ? { errorStack } : {}),
	};

	if (historyId) {
		await IntegrationHistory.updateOne({ _id: historyId }, { $set: history });
		return historyId;
	}

	// Can't create a new history without there being an integration
	if (!history.integration) {
		throw new Error('error-invalid-integration');
	}

	history._createdAt = new Date();

	const _id = Random.id();

	await IntegrationHistory.insertOne({ _id, ...history } as IIntegrationHistory);

	return _id;
};
