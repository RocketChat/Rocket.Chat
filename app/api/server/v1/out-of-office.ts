import { check, Match } from 'meteor/check';

import { API } from '../api';
import { updateOutOfOffice } from '../../../out-of-office/server';
import { OutOfOfficeUsers, OutOfOfficeRooms } from '../../../models/server';

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

			const { message } = updateOutOfOffice({
				userId: this.userId,
				...this.bodyParams,
			});

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

			// need to subtract the offset here
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

// temporary - only for debugging purposes

API.v1.addRoute('outOfOffice.getAll', {
	get() {
		const allDocuments = OutOfOfficeUsers.find({}).fetch();

		return API.v1.success({
			'all-docs': allDocuments,
		});
	},
});

API.v1.addRoute('outOfOffice.removeAll', {
	get() {
		OutOfOfficeUsers.remove({});
		return API.v1.success({ result: 'deleted all user documents' });
	},
});

API.v1.addRoute('outOfOffice.getAllRooms', {
	get() {
		return API.v1.success(OutOfOfficeRooms.find({}).fetch());
	},
});

API.v1.addRoute('outOfOffice.removeAllRooms', {
	get() {
		OutOfOfficeRooms.remove({});
		return API.v1.success({ result: 'deleted all room documents' });
	},
});
