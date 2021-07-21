import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../../../app/authorization';
import CannedResponse from '../../../models/server/models/CannedResponse';
import LivechatDepartment from '../../../../../app/models/server/models/LivechatDepartment';
import { Users } from '../../../../../app/models';
import notifications from '../../../../../app/notifications/server/lib/Notifications';

Meteor.methods({
	saveCannedResponse(_id, responseData) {
		const userId = Meteor.userId();
		if (!userId || !hasPermission(userId, 'save-canned-responses')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'saveCannedResponse' });
		}

		check(_id, Match.Maybe(String));

		check(responseData, {
			shortcut: String,
			text: String,
			scope: String,
			tags: Match.Maybe([String]),
			departmentId: Match.Maybe(String),
		});

		const canSaveAll = hasPermission(userId, 'save-all-canned-responses');
		if (!canSaveAll && ['global'].includes(responseData.scope)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed to modify canned responses on *global* scope', { method: 'saveCannedResponse' });
		}

		const canSaveDepartment = hasPermission(userId, 'save-department-canned-responses');
		if (!canSaveAll && !canSaveDepartment && ['department'].includes(responseData.scope)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed to modify canned responses on *department* scope', { method: 'saveCannedResponse' });
		}
		// TODO: check if the department i'm trying to save is a department i can interact with

		// check if the response already exists and we're not updating one
		const duplicateShortcut = CannedResponse.findOneByShortcut(responseData.shortcut, { fields: { _id: 1 } });
		if ((!_id && duplicateShortcut) || (_id && duplicateShortcut._id !== _id)) {
			throw new Meteor.Error('error-invalid-shortcut', 'Shortcut provided already exists', { method: 'saveCannedResponse' });
		}

		if (responseData.scope === 'department' && !responseData.departmentId) {
			throw new Meteor.Error('error-invalid-department', 'Invalid department', { method: 'saveCannedResponse' });
		}

		if (responseData.departmentId && !LivechatDepartment.findOneById(responseData.departmentId)) {
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
			responseData.createdBy = { _id: user._id, username: user.username };
			responseData._createdAt = new Date();
		}
		const createdCannedResponse = CannedResponse.createOrUpdateCannedResponse(_id, responseData);
		notifications.streamCannedResponses.emit('canned-responses', { type: 'changed', ...createdCannedResponse });

		return createdCannedResponse;
	},
});
