import { isGETslaParams, isDELETEslaParams } from '@rocket.chat/rest-typings';

import { API } from '../../../../../app/api/server';
import { deleteSLA, findSLA, findSLAById } from './lib/sla';

API.v1.addRoute(
	'livechat/sla',
	{ authRequired: true, permissionsRequired: { GET: { permissions: ['manage-livechat-sla', 'view-l-room'], operation: 'hasAny' } } },
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
			if (!isGETslaParams(this.urlParams)) {
				return API.v1.failure('Invalid URL params');
			}
			const { slaId } = this.urlParams;

			const sla = await findSLAById({
				slaId,
			});

			if (!sla) {
				return API.v1.notFound(`SLA with id ${slaId} not found`);
			}
			return API.v1.success(sla);
		},
		async delete() {
			if (!isDELETEslaParams(this.urlParams)) {
				return API.v1.failure('Invalid URL params');
			}
			const { slaId } = this.urlParams;
			try {
				await deleteSLA(slaId);
				return API.v1.success();
			} catch (e) {
				return API.v1.failure(e);
			}
		},
	},
);
