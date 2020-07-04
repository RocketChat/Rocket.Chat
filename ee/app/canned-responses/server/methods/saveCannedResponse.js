import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../../../app/authorization';
import CannedResponse from '../../../models/server/models/CannedResponse';
import { Users } from '../../../../../app/models';
import { cannedResponsesStreamer } from '../streamer';

Meteor.methods({
	saveCannedResponse(_id, responseData) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'save-canned-responses')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'saveCannedResponse' });
		}

		check(_id, Match.Maybe(String));

		check(responseData, {
			shortcut: String,
			text: String,
			scope: String,
			departmentId: Match.Maybe(String),
		});

		if (responseData.scope === 'department' && !responseData.departmentId) {
			throw new Meteor.Error('error-invalid-department', 'Invalid department', { method: 'saveCannedResponse' });
		}

		if (_id) {
			const cannedResponse = CannedResponse.findOneById(_id);
			if (!cannedResponse) {
				throw new Meteor.Error('error-canned-response-not-found', 'Canned Response not found', { method: 'saveCannedResponse' });
			}

			responseData.scope = cannedResponse.scope;
			responseData.createdBy = cannedResponse.createdBy;
		} else {
			const user = Users.findOneById(Meteor.userId());

			if (responseData.scope === 'user') {
				responseData.userId = user._id;
			}
			responseData.createdBy = user.username;
		}
		const createdCannedResponse = CannedResponse.createOrUpdateCannedResponse(_id, responseData);
		cannedResponsesStreamer.emit('canned-responses', { type: 'changed', ...createdCannedResponse });

		return createdCannedResponse;
	},
});
