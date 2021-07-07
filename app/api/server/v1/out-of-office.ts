import { check, Match } from 'meteor/check';

import { API } from '../api';
import { updateOutOfOffice } from '../../../out-of-office/server';
import { OutOfOffice } from '../../../models/server';

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
			const foundDocuments = OutOfOffice.findAllByUserId(this.userId, {
				isEnabled: 1,
				roomId: 1,
				customMessage: 1,
				startDate: 1,
				endDate: 1,
			});

			// need to subtract the offset here
			if (!foundDocuments || !Array.isArray(foundDocuments) || foundDocuments.length === 0) {
				return API.v1.success({
					error: 'error-not-found',
					details:
            'Out of Office document associated with this user-id could not be found',
				});
			}

			const roomIds = foundDocuments.filter(foundDocument=>foundDocument.roomId!==null).map(foundDocument=>foundDocument.roomId);
			const statusDocument = foundDocuments.find(foundDocument=>foundDocument.roomId===null);

			return API.v1.success({roomIds,isEnabled:statusDocument?.isEnabled,startDate:statusDocument?.startDate,endDate:statusDocument?.endDate,customMessage:statusDocument?.customMessage});
		},
	},
);

// temporary - only for debugging purposes

API.v1.addRoute('outOfOffice.getAll', {
	get() {
		const allDocuments = OutOfOffice.find({}).fetch();

		return API.v1.success({
			'all-docs': allDocuments,
		});
	},
});

API.v1.addRoute('outOfOffice.removeAll', {
	get() {
		OutOfOffice.remove({});
		return API.v1.success({ result: 'deleted all documents' });
	},
});
