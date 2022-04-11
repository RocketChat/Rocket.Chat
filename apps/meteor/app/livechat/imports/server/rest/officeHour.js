import { API } from '../../../../api/server';
import { findLivechatOfficeHours } from '../../../server/api/lib/officeHour';

API.v1.addRoute(
	'livechat/office-hours',
	{ authRequired: true },
	{
		get() {
			const { officeHours } = Promise.await(findLivechatOfficeHours({ userId: this.userId }));
			return API.v1.success(
				this.deprecationWarning({
					endpoint: 'livechat/office-hours',
					versionWillBeRemoved: '4.0.0',
					response: {
						officeHours,
					},
				}),
			);
		},
	},
);
