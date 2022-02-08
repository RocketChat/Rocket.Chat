import { ILivechatBusinessHour } from '../../../../../definition/ILivechatBusinessHour';
import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatBusinessHours } from '../../../../models/server/raw';

export async function findLivechatOfficeHours({ userId }: { userId: string }): Promise<{ officeHours: ILivechatBusinessHour } | null> {
	if (!(await hasPermissionAsync(userId, 'view-livechat-business-hours'))) {
		throw new Error('error-not-authorized');
	}

	return {
		// @ts-ignore: Object is possibly 'null'
		officeHours: (await LivechatBusinessHours.findOneDefaultBusinessHour()).workHours,
	};
}
