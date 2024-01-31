import { Voip } from '@rocket.chat/core-services';
import type { IVoipConnectorResult, IQueueSummary, IQueueMembershipDetails, IQueueMembershipSubscription } from '@rocket.chat/core-typings';
import { isVoipQueuesGetMembershipSubscriptionProps, isVoipQueuesGetQueuedCallsForThisExtensionProps } from '@rocket.chat/rest-typings';

import { API } from '../../api';

API.v1.addRoute(
	'voip/queues.getSummary',
	{ authRequired: true, permissionsRequired: ['inbound-voip-calls'] },
	{
		async get() {
			const queueSummary = await Voip.getQueueSummary();
			return API.v1.success({ summary: queueSummary.result as IQueueSummary[] });
		},
	},
);

API.v1.addRoute(
	'voip/queues.getQueuedCallsForThisExtension',
	{ authRequired: true, permissionsRequired: ['inbound-voip-calls'], validateParams: isVoipQueuesGetQueuedCallsForThisExtensionProps },
	{
		async get() {
			const membershipDetails: IVoipConnectorResult = await Voip.getQueuedCallsForThisExtension(this.queryParams);
			return API.v1.success(membershipDetails.result as IQueueMembershipDetails);
		},
	},
);

API.v1.addRoute(
	'voip/queues.getMembershipSubscription',
	{ authRequired: true, permissionsRequired: ['inbound-voip-calls'], validateParams: isVoipQueuesGetMembershipSubscriptionProps },
	{
		async get() {
			const membershipDetails: IVoipConnectorResult = await Voip.getQueueMembership(this.queryParams);
			return API.v1.success(membershipDetails.result as IQueueMembershipSubscription);
		},
	},
);
