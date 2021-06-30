import { check, Match } from 'meteor/check';

import { API } from '../api';
import { updateOutOfOffice } from '../../../out-of-office/server/index';
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


			const startDate = this.bodyParams.startDate ? new Date(this.bodyParams.startDate) :null;
			const endDate = this.bodyParams.endDate?new Date(this.bodyParams.endDate):null 

			if(startDate && endDate && startDate > endDate){
				throw new Meteor.Error('invalid-date','Your Start data has to be before the End Date');
			}

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
			const foundDocument = OutOfOffice.findOneByUserId(this.userId, {
				isEnabled: 1,
				roomIds: 1,
				customMessage: 1,
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

// temporary - only for debugging purposes

API.v1.addRoute('outOfOffice.getAll', {
	get() {
		const allDocuments = OutOfOffice.find({}).fetch();

		return API.v1.success({
			'all-docs': allDocuments,
		});
	},
});

API.v1.addRoute('outOfOffice.getById', {
	get() {
		const { docId } = this.bodyParams;
		if (!docId) {
			return API.v1.failure('doc id not provided');
		}
		const doc = OutOfOffice.findOneById(docId);

		return API.v1.success({ 'the-found': doc });
	},
});

API.v1.addRoute('outOfOffice.removeAll', {
	get() {
		OutOfOffice.remove({});
		return API.v1.success({ result: 'deleted all documents' });
	},
});
