import type { IOmnichannelCannedResponse, ILivechatDepartment } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { LivechatDepartment, CannedResponse, Users } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import notifications from '../../../../../app/notifications/server/lib/Notifications';

type ResponseData = {
	shortcut: string;
	text: string;
	scope: string;
	tags?: string[];
	departmentId?: string;
};
declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		saveCannedResponse(
			_id: string,
			responseData: ResponseData,
		): Promise<Omit<IOmnichannelCannedResponse, '_updatedAt' | '_createdAt'> & { _createdAt?: Date }>;
	}
}

export const saveCannedResponse = async (
	userId: string,
	responseData: ResponseData,
	_id?: string,
): Promise<Omit<IOmnichannelCannedResponse, '_updatedAt' | '_createdAt'> & { _createdAt?: Date }> => {
	if (!(await hasPermissionAsync(userId, 'save-canned-responses'))) {
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
	const duplicateShortcut = await CannedResponse.findOneByShortcut(responseData.shortcut, {
		projection: { _id: 1 },
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

	if (
		responseData.departmentId &&
		!(await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id'>>(responseData.departmentId, { projection: { _id: 1 } }))
	) {
		throw new Meteor.Error('error-invalid-department', 'Invalid department', {
			method: 'saveCannedResponse',
		});
	}

	let result: Omit<IOmnichannelCannedResponse, '_updatedAt' | '_createdAt'> & { _createdAt?: Date };

	if (_id) {
		const cannedResponse = await CannedResponse.findOneById(_id);
		if (!cannedResponse) {
			throw new Meteor.Error('error-canned-response-not-found', 'Canned Response not found', {
				method: 'saveCannedResponse',
			});
		}

		result = await CannedResponse.updateCannedResponse(_id, { ...responseData, createdBy: cannedResponse.createdBy });
	} else {
		const user = await Users.findOneById(userId);

		const data = {
			...responseData,
			...(responseData.scope === 'user' && { userId: user?._id }),
			createdBy: { _id: user?._id || '', username: user?.username || '' },
			_createdAt: new Date(),
		};

		result = await CannedResponse.createCannedResponse(data);
	}

	notifications.streamCannedResponses.emit('canned-responses', {
		type: 'changed',
		...result,
	});

	return result;
};

Meteor.methods<ServerMethods>({
	async saveCannedResponse(_id, responseData) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'saveCannedResponse' });
		}

		return saveCannedResponse(userId, responseData, _id);
	},
});
