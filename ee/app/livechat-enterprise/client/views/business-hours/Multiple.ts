import { IBusinessHourBehavior } from '../../../../../../app/livechat/client/views/app/business-hours/IBusinessHourBehavior';
import { ILivechatBusinessHour, LivechatBussinessHourTypes } from '../../../../../../definition/ILivechatBusinessHour';

export class MultipleBusinessHoursBehavior implements IBusinessHourBehavior {
	getView(): string {
		return 'livechatBusinessHours';
	}

	shouldShowCustomTemplate(businessHourData: ILivechatBusinessHour): boolean {
		console.log(businessHourData);
		return !businessHourData._id || businessHourData.type !== LivechatBussinessHourTypes.DEFAULT;
	}

	shouldShowBackButton(): boolean {
		return true;
	}
}
