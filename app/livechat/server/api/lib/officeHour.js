import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatBusinessHours } from '../../../../../server/models/raw';

export async function findLivechatOfficeHours({ userId }) {
	if (!await hasPermissionAsync(userId, 'view-livechat-business-hours')) {
		throw new Error('error-not-authorized');
	}

	return {
		officeHours: (await LivechatBusinessHours.findOneDefaultBusinessHour()).workHours,
	};
}
