import { isGETLivechatTriggersParams } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import { findTriggers, findTriggerById } from '../../../server/api/lib/triggers';

API.v1.addRoute(
	'livechat/triggers',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETLivechatTriggersParams },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();

			const triggers = await findTriggers({
				pagination: {
					offset,
					count,
					sort,
				},
			});

			return API.v1.success(triggers);
		},
	},
);

API.v1.addRoute(
	'livechat/triggers/:_id',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		async get() {
			const trigger = await findTriggerById({
				triggerId: this.urlParams._id,
			});

			return API.v1.success({
				trigger,
			});
		},
	},
);
