import { API } from '../../../../api/server';
import { findLivechatOfficeHours } from '../../../server/api/lib/officeHour';
import { deprecationWarning } from '../../../../api/server/helpers/deprecationWarning';

API.v1.addRoute(
	'livechat/office-hours',
	{ authRequired: true },
	{
		async get() {
			const { officeHours } = await findLivechatOfficeHours({ userId: this.userId });
			return API.v1.success(
				deprecationWarning({
					endpoint: 'livechat/office-hours',
					versionWillBeRemoved: '5.0.0',
					response: {
						officeHours,
					},
				}),
			);
		},
	},
);
