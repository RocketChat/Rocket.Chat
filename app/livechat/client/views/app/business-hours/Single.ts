import { IBusinessHourBehavior } from './IBusinessHourBehavior';

export class SingleBusinessHourBehavior implements IBusinessHourBehavior {
	getView(): string {
		return 'livechatBusinessHoursForm';
	}

	shouldShowCustomTemplate(): boolean {
		return false;
	}

	shouldShowBackButton(): boolean {
		return false;
	}
}
