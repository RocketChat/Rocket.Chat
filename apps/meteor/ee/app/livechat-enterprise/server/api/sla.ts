import { API } from '../../../../../app/api/server';
import { findSLA, findSLAById } from './lib/sla';

API.v1.addRoute(
	'livechat/sla',
	{ authRequired: true, permissionsRequired: { GET: { permissions: ['manage-livechat-priorities', 'view-l-room'], operation: 'hasAny' } } },
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
	{ authRequired: true, permissionsRequired: { GET: { permissions: ['manage-livechat-priorities', 'view-l-room'], operation: 'hasAny' } } },
	{
		async get() {
			const { slaId } = this.urlParams;

			const sla = await findSLAById({
				slaId,
			});

			if (!sla) {
				return API.v1.notFound(`SLA with id ${slaId} not found`);
			}

			return API.v1.success(sla);
		},
	},
);
