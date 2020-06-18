import { IBusinessHour } from '../../../../../../app/livechat/client/views/app/business-hours/IBusinessHour';

export class MultipleBusinessHours implements IBusinessHour {
	getView(): string {
		return 'livechatBusinessHours';
	}
}
