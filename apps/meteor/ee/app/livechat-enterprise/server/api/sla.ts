import { isLivechatPrioritiesProps } from '@rocket.chat/rest-typings';
import { OmnichannelServiceLevelAgreements } from '@rocket.chat/models';

import { API } from '../../../../../app/api/server';
import { findSLA } from './lib/sla';

API.v1.addRoute(
	'livechat/sla',
	{
		authRequired: true,
		permissionsRequired: { GET: { permissions: ['manage-livechat-sla', 'view-l-room'], operation: 'hasAny' } },
		validateParams: isLivechatPrioritiesProps,
	},
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const { text } = this.queryParams;

			return API.v1.success(
				await findSLA({
					text,
					pagination: {
						offset,
						count,
						sort,
					},
				}),
			);
		},
	},
);

API.v1.addRoute(
	'livechat/sla/:slaId',
	{
		authRequired: true,
		permissionsRequired: {
			GET: { permissions: ['manage-livechat-sla', 'view-l-room'], operation: 'hasAny' },
			DELETE: { permissions: ['manage-livechat-sla'], operation: 'hasAny' },
		},
	},
	{
		async get() {
			const { slaId } = this.urlParams;

			const sla = await OmnichannelServiceLevelAgreements.findOneById(slaId);

			if (!sla) {
				return API.v1.notFound(`SLA with id ${slaId} not found`);
			}
			return API.v1.success(sla);
		},
		async delete() {
			const { slaId } = this.urlParams;
			await OmnichannelServiceLevelAgreements.removeById(slaId);

			return API.v1.success();
		},
	},
);
