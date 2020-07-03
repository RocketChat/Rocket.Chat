import { IBusinessHourBehavior } from './IBusinessHourBehavior';

export class SingleBusinessHourBehavior implements IBusinessHourBehavior {
	getView(): string {
		return 'livechatBusinessHoursForm';
	}

	showCustomTemplate(): boolean {
		return false;
	}

	showBackButton(): boolean {
		return false;
	}

	showTimezoneTemplate(): boolean {
		return false;
	}
}
