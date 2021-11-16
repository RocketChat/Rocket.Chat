import { ILivechatBusinessHour } from '../../../../../definition/ILivechatBusinessHour';

export type OmnichannelBusinessHoursEndpoints = {
	'livechat/business-hours.list': {
		GET: () => ({ businessHours: ILivechatBusinessHour[] });
	};
}
