import { Match, check } from 'meteor/check';

import { API } from '../../api';
import { Voip } from '../../../../../server/sdk';
import { IVoipConnectorResult } from '../../../../../definition/IVoipConnectorResult';
import { logger } from './logger';

API.v1.addRoute('voip/queues.getSummary', { authRequired: true }, {
	async get() {
		const queueSummary = await Voip.getQueueSummary();
		logger.debug({ msg: 'API = voip/queues.getSummary ', result: queueSummary });
		return API.v1.success({ summary: queueSummary.result });
	},
});

API.v1.addRoute('voip/queues.getQueuedCallsForThisExtension', { authRequired: true }, {
	async get() {
		check(this.requestParams(), Match.ObjectIncluding({
			extension: String,
		}));
		const membershipDetails: IVoipConnectorResult = await Voip.getQueuedCallsForThisExtension(this.requestParams());
		logger.debug({ msg: 'API = queues.getCallWaitingInQueuesForThisExtension', result: membershipDetails });
		return API.v1.success({ ...membershipDetails.result });
	},
});
