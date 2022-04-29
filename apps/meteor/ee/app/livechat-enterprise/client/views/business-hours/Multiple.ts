import { ILivechatBusinessHour, LivechatBusinessHourTypes } from '@rocket.chat/core-typings';

import { IBusinessHourBehavior } from '../../../../../../app/livechat/client/views/app/business-hours/IBusinessHourBehavior';

export class MultipleBusinessHoursBehavior implements IBusinessHourBehavior {
	getView(): string {
		return 'livechatBusinessHours';
	}

	showCustomTemplate(businessHourData: ILivechatBusinessHour): boolean {
		return !businessHourData._id || businessHourData.type !== LivechatBusinessHourTypes.DEFAULT;
	}

	showTimezoneTemplate(): boolean {
		return true;
	}

	showBackButton(): boolean {
		return true;
	}
}
