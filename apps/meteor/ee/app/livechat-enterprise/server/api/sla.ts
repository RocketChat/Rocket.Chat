import { OmnichannelServiceLevelAgreements } from '@rocket.chat/models';
import { isLivechatPrioritiesProps, isCreateOrUpdateLivechatSlaProps } from '@rocket.chat/rest-typings';

import { API } from '../../../../../app/api/server';
import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';
import { findSLA } from './lib/sla';

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
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
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
		license: ['livechat-enterprise'],
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
