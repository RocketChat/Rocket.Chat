import { IBusinessHourWorkHour } from '@rocket.chat/core-typings';

import { LivechatBusinessHours } from '../../../../models/server/raw';

export async function findLivechatOfficeHours(): Promise<{ officeHours: IBusinessHourWorkHour[] | undefined }> {
	return {
		officeHours: (await LivechatBusinessHours.findOneDefaultBusinessHour())?.workHours,
	};
}
