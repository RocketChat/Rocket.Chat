import { Match, check } from 'meteor/check';

import { API } from '../../api';
import { Voip } from '../../../../../server/sdk';
import { IQueueDetails, IQueueSummary } from '../../../../../definition/ACDQueues';
import { logger } from './logger';

API.v1.addRoute('voip/queues.getSummary', { authRequired: true }, {
	async get() {
		const { result: summary } = await Voip.getQueueSummary();
		logger.debug({ msg: 'API = voip/queues.getSummary ', result: summary });
		return API.v1.success({ summary: summary as IQueueSummary[] });
	},
});

API.v1.addRoute('voip/queues.getQueuedCallsForThisExtension', { authRequired: true }, {
	async get() {
		check(this.requestParams(), Match.ObjectIncluding({
			extension: String,
		}));
		const { result } = await Voip.getQueuedCallsForThisExtension(this.requestParams());
		logger.debug({ msg: 'API = queues.getCallWaitingInQueuesForThisExtension', result });
		return API.v1.success({ ...(result as IQueueDetails) });
	},
});
