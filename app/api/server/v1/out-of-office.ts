import { check, Match } from 'meteor/check';

import { API } from '../api';
import { updateOutOfOffice } from '../../../out-of-office/server';
import { OutOfOfficeUsers } from '../../../models/server';

API.v1.addRoute(
	'outOfOffice.toggle',
	{ authRequired: true },
	{
		post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					isEnabled: Boolean,
					roomIds: Array,
					customMessage: String,
					startDate: String,
					endDate: String,
				}),
			);

			const { message } = (Promise as any).await(updateOutOfOffice({
				userId: this.userId,
				...this.bodyParams,
			}));

			return API.v1.success({ message });
		},
	},
);

API.v1.addRoute(
	'outOfOffice.status',
	{ authRequired: true },
	{
		get() {
			const foundDocument = OutOfOfficeUsers.findOneByUserId(this.userId, {
				fields: {
					isEnabled: 1,
					roomIds: 1,
					customMessage: 1,
					startDate: 1,
					endDate: 1,
				},
			});

			if (!foundDocument) {
				return API.v1.success({
					error: 'error-not-found',
					details:
            'Out of Office document associated with this user-id could not be found',
				});
			}

			return API.v1.success(foundDocument);
		},
	},
);
