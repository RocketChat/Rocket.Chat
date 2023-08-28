import { LivechatTrigger } from '@rocket.chat/models';
import { isGETLivechatTriggersParams, isPOSTLivechatTriggersParams } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import { getPaginationItems } from '../../../../api/server/helpers/getPaginationItems';
import { findTriggers, findTriggerById } from '../../../server/api/lib/triggers';

API.v1.addRoute(
	'livechat/triggers',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		validateParams: {
			GET: isGETLivechatTriggersParams,
			POST: isPOSTLivechatTriggersParams,
		},
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();

			const triggers = await findTriggers({
				pagination: {
					offset,
					count,
					sort,
				},
			});

			return API.v1.success(triggers);
		},
		async post() {
			const { _id, name, description, enabled, runOnce, conditions, actions } = this.bodyParams;

			if (_id) {
				await LivechatTrigger.updateById(_id, { name, description, enabled, runOnce, conditions, actions });
			} else {
				await LivechatTrigger.insertOne({ name, description, enabled, runOnce, conditions, actions });
			}

			return API.v1.success();
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
