import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatOfficeHour } from '../../../../models/server/raw';

export async function findLivechatOfficeHours({ userId }) {
	if (!await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}

	return {
		officeHours: await LivechatOfficeHour.find({}, { sort: { code: 1 } }).toArray(),
	};
}
