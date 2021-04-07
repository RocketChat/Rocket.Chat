import { Random } from 'meteor/random';
import _ from 'underscore';

import * as Models from '../../../models/server';

type History = {
	type: string;
	step: any;
	integration?: any;
	event?: any;
	data?: any;
	triggerWord?: any;
	ranPrepareScript?: any;
	prepareSentMessage?: any;
	processSentMessage?: any;
	resultMessage?: any;
	finished?: any;
	url?: any;
	httpCallData?: any;
	httpError?: any;
	httpResult?: any;
	error?: any;
	errorStack?: any;
	_createdAt?: any;
}

class UpdateHistoryWebhook {
	updateHistory({
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
	}:
	{
		historyId: any;
		step: any;
		integration: any;
		event: any;
		data: any;
		triggerWord: any;
		ranPrepareScript: any;
		prepareSentMessage: any;
		processSentMessage: any;
		resultMessage: any;
		finished: any;
		url: any;
		httpCallData: any;
		httpError: any;
		httpResult: any;
		error: any;
		errorStack: any;
	}): any {
		const history: History = {
			type: 'outgoing-webhook',
			step,
		};

		// Usually is only added on initial insert
		if (integration) {
			history.integration = integration;
		}

		// Usually is only added on initial insert
		if (event) {
			history.event = event;
		}

		if (data) {
			history.data = { ...data };

			if (data.user) {
				history.data.user = _.omit(data.user, ['services']);
			}

			if (data.room) {
				history.data.room = data.room;
			}
		}

		if (triggerWord) {
			history.triggerWord = triggerWord;
		}

		if (typeof ranPrepareScript !== 'undefined') {
			history.ranPrepareScript = ranPrepareScript;
		}

		if (prepareSentMessage) {
			history.prepareSentMessage = prepareSentMessage;
		}

		if (processSentMessage) {
			history.processSentMessage = processSentMessage;
		}

		if (resultMessage) {
			history.resultMessage = resultMessage;
		}

		if (typeof finished !== 'undefined') {
			history.finished = finished;
		}

		if (url) {
			history.url = url;
		}

		if (typeof httpCallData !== 'undefined') {
			history.httpCallData = httpCallData;
		}

		if (httpError) {
			history.httpError = httpError;
		}

		if (typeof httpResult !== 'undefined') {
			history.httpResult = JSON.stringify(httpResult, null, 2);
		}

		if (typeof error !== 'undefined') {
			history.error = error;
		}

		if (typeof errorStack !== 'undefined') {
			history.errorStack = errorStack;
		}

		if (historyId) {
			Models.IntegrationHistory.update({ _id: historyId }, { $set: history });
			return historyId;
		}
		history._createdAt = new Date();
		return Models.IntegrationHistory.insert(Object.assign({ _id: Random.id() }, history));
	}
}

export default new UpdateHistoryWebhook();
