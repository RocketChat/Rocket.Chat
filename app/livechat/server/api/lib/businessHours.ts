import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { businessHourManager } from '../../business-hour';

export async function findLivechatBusinessHour(userId: string, id?: string) {
	if (!await hasPermissionAsync(userId, 'view-livechat-officeHours')) {
		throw new Error('error-not-authorized');
	}

	return {
		businessHour: await businessHourManager.getBusinessHour(id),
	};
}
