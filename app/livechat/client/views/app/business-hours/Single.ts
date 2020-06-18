import { IBusinessHour } from './IBusinessHour';

export class SingleBusinessHour implements IBusinessHour {
	getView(): string {
		return 'livechatBusinessHoursForm';
	}

	shouldShowCustomTemplate(): boolean {
		return false;
	}
}
