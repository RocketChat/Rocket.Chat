import { SingleBusinessHourBehavior } from '../../../../app/livechat/client/views/app/business-hours/Single';

export class EESingleBusinessHourBehaviour extends SingleBusinessHourBehavior {
	showTimezoneTemplate(): boolean {
		return true;
	}
}
