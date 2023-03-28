import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import CannedResponse from '../../../models/server/models/CannedResponse';
import LivechatDepartment from '../../../../../app/models/server/models/LivechatDepartment';
import { Users } from '../../../../../app/models/server';
import notifications from '../../../../../app/notifications/server/lib/Notifications';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		saveCannedResponse(
			_id: string,
			responseData: {
				shortcut: string;
				text: string;
				scope: string;
				tags?: string[];
				departmentId?: string;
			},
		): void;
	}
}

Meteor.methods<ServerMethods>({
	async saveCannedResponse(_id, responseData) {
		const userId = Meteor.userId();
		if (!userId || !(await hasPermissionAsync(userId, 'save-canned-responses'))) {
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

		const canSaveAll = await hasPermissionAsync(userId, 'save-all-canned-responses');
		if (!canSaveAll && ['global'].includes(responseData.scope)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed to modify canned responses on *global* scope', {
				method: 'saveCannedResponse',
			});
		}

		const canSaveDepartment = await hasPermissionAsync(userId, 'save-department-canned-responses');
		if (!canSaveAll && !canSaveDepartment && ['department'].includes(responseData.scope)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed to modify canned responses on *department* scope', {
				method: 'saveCannedResponse',
			});
		}

		// to avoid inconsistencies
		if (responseData.scope === 'user') {
			delete responseData.departmentId;
		}
		// TODO: check if the department i'm trying to save is a department i can interact with

		// check if the response already exists and we're not updating one
		const duplicateShortcut = CannedResponse.findOneByShortcut(responseData.shortcut, {
			fields: { _id: 1 },
		});
		if ((!_id && duplicateShortcut) || (_id && duplicateShortcut && duplicateShortcut._id !== _id)) {
			throw new Meteor.Error('error-invalid-shortcut', 'Shortcut provided already exists', {
				method: 'saveCannedResponse',
			});
		}

		if (responseData.scope === 'department' && !responseData.departmentId) {
			throw new Meteor.Error('error-invalid-department', 'Invalid department', {
				method: 'saveCannedResponse',
			});
		}

		if (responseData.departmentId && !LivechatDepartment.findOneById(responseData.departmentId)) {
			throw new Meteor.Error('error-invalid-department', 'Invalid department', {
				method: 'saveCannedResponse',
			});
		}

		const data: {
			shortcut: string;
			text: string;
			scope: string;
			tags: string[];
			departmentId?: string;
			createdBy?: {
				_id: string;
				username: string;
			};
			_createdAt?: Date;
			userId?: string;
		} = { ...responseData, departmentId: responseData.departmentId ?? undefined };

		if (_id) {
			const cannedResponse = CannedResponse.findOneById(_id);
			if (!cannedResponse) {
				throw new Meteor.Error('error-canned-response-not-found', 'Canned Response not found', {
					method: 'saveCannedResponse',
				});
			}

			data.createdBy = cannedResponse.createdBy;
		} else {
			const user = Users.findOneById(Meteor.userId());

			if (data.scope === 'user') {
				data.userId = user._id;
			}
			data.createdBy = { _id: user._id, username: user.username };
			data._createdAt = new Date();
		}
		const createdCannedResponse = CannedResponse.createOrUpdateCannedResponse(_id, data);
		notifications.streamCannedResponses.emit('canned-responses', {
			type: 'changed',
			...createdCannedResponse,
		});

		return createdCannedResponse;
	},
});
