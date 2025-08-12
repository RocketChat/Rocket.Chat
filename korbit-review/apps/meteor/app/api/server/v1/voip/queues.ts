import { VoipAsterisk } from '@rocket.chat/core-services';
import type { IVoipConnectorResult, IQueueSummary, IQueueMembershipDetails, IQueueMembershipSubscription } from '@rocket.chat/core-typings';
import { Match, check } from 'meteor/check';

import { API } from '../../api';

API.v1.addRoute(
	'voip/queues.getSummary',
	{ authRequired: true, permissionsRequired: ['inbound-voip-calls'] },
	{
		async get() {
			const queueSummary = await VoipAsterisk.getQueueSummary();
			return API.v1.success({ summary: queueSummary.result as IQueueSummary[] });
		},
	},
);

API.v1.addRoute(
	'voip/queues.getQueuedCallsForThisExtension',
	{ authRequired: true, permissionsRequired: ['inbound-voip-calls'] },
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					extension: String,
				}),
			);
			const membershipDetails: IVoipConnectorResult = await VoipAsterisk.getQueuedCallsForThisExtension(this.queryParams);
			return API.v1.success(membershipDetails.result as IQueueMembershipDetails);
		},
	},
);

API.v1.addRoute(
	'voip/queues.getMembershipSubscription',
	{ authRequired: true, permissionsRequired: ['inbound-voip-calls'] },
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					extension: String,
				}),
			);
			const membershipDetails: IVoipConnectorResult = await VoipAsterisk.getQueueMembership(this.queryParams);
			return API.v1.success(membershipDetails.result as IQueueMembershipSubscription);
		},
	},
);
