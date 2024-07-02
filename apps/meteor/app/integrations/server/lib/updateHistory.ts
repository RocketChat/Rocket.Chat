import type { IIntegrationHistory, OutgoingIntegrationEvent, IIntegration, IMessage, AtLeast } from '@rocket.chat/core-typings';
import { IntegrationHistory } from '@rocket.chat/models';

import { omit } from '../../../../lib/utils/omit';
import { notifyOnIntegrationHistoryChangedById, notifyOnIntegrationHistoryChanged } from '../../../lib/server/lib/notifyListener';

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
		// Projecting just integration field to comply with existing listener behaviour
		const integrationHistory = await IntegrationHistory.updateById(historyId, history, { projection: { 'integration._id': 1 } });
		if (!integrationHistory) {
			throw new Error('error-updating-integration-history');
		}
		void notifyOnIntegrationHistoryChanged(integrationHistory, 'updated', history);
		return historyId;
	}

	// Can't create a new history without there being an integration
	if (!history.integration) {
		throw new Error('error-invalid-integration');
	}

	// TODO: Had to force type cast here because of function's signature
	// It would be easier if we separate into create and update functions
	const { insertedId } = await IntegrationHistory.create(history as IIntegrationHistory);

	if (!insertedId) {
		throw new Error('error-creating-integration-history');
	}

	void notifyOnIntegrationHistoryChangedById(insertedId, 'inserted');

	return insertedId;
};
