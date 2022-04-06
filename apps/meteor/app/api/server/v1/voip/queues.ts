import { Match, check } from 'meteor/check';

import { API } from '../../api';
import { Voip } from '../../../../../server/sdk';
import type { IVoipConnectorResult } from '@rocket.chat/core-typings';
import type { IQueueSummary } from '@rocket.chat/core-typings';
import type { IQueueMembershipDetails, IQueueMembershipSubscription } from '@rocket.chat/core-typings';

API.v1.addRoute(
	'voip/queues.getSummary',
	{ authRequired: true },
	{
		async get() {
			const queueSummary = await Voip.getQueueSummary();
			return API.v1.success({ summary: queueSummary.result as IQueueSummary[] });
		},
	},
);

API.v1.addRoute(
	'voip/queues.getQueuedCallsForThisExtension',
	{ authRequired: true },
	{
		async get() {
			check(
				this.requestParams(),
				Match.ObjectIncluding({
					extension: String,
				}),
			);
			const membershipDetails: IVoipConnectorResult = await Voip.getQueuedCallsForThisExtension(this.requestParams());
			return API.v1.success(membershipDetails.result as IQueueMembershipDetails);
		},
	},
);

API.v1.addRoute(
	'voip/queues.getMembershipSubscription',
	{ authRequired: true },
	{
		async get() {
			check(
				this.requestParams(),
				Match.ObjectIncluding({
					extension: String,
				}),
			);
			const membershipDetails: IVoipConnectorResult = await Voip.getQueueMembership(this.requestParams());
			return API.v1.success(membershipDetails.result as IQueueMembershipSubscription);
		},
	},
);
