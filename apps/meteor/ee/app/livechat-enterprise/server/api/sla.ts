import { isLivechatPrioritiesProps, isCreateOrUpdateLivechatSlaProps } from '@rocket.chat/rest-typings';
import { OmnichannelServiceLevelAgreements } from '@rocket.chat/models';

import { API } from '../../../../../app/api/server';
import { findSLA } from './lib/sla';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

API.v1.addRoute(
	'livechat/sla',
	{
		authRequired: true,
		permissionsRequired: {
			GET: { permissions: ['manage-livechat-sla', 'view-l-room'], operation: 'hasAny' },
			POST: { permissions: ['manage-livechat-sla'], operation: 'hasAny' },
		},
		validateParams: {
			GET: isLivechatPrioritiesProps,
			POST: isCreateOrUpdateLivechatSlaProps,
		},
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
		async post() {
			const { name, description, dueTimeInMinutes } = this.bodyParams;

			const newSla = await LivechatEnterprise.saveSLA(null, {
				name,
				description,
				dueTimeInMinutes,
			});

			return API.v1.success({ sla: newSla });
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
			PUT: { permissions: ['manage-livechat-sla'], operation: 'hasAny' },
		},
		validateParams: {
			PUT: isCreateOrUpdateLivechatSlaProps,
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

			await LivechatEnterprise.removeSLA(slaId);

			return API.v1.success();
		},
		async put() {
			const { name, description, dueTimeInMinutes } = this.bodyParams;
			const { slaId } = this.urlParams;

			const updatedSla = await LivechatEnterprise.saveSLA(slaId, {
				name,
				description,
				dueTimeInMinutes,
			});

			return API.v1.success({ sla: updatedSla });
		},
	},
);
