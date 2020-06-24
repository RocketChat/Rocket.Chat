import { IBusinessHourBehavior } from './IBusinessHourBehavior';
import { SingleBusinessHourBehavior } from './Single';
import { ILivechatBusinessHour } from '../../../../../../definition/ILivechatBusinessHour';

class BusinessHoursManager {
	private behavior: IBusinessHourBehavior;

	constructor(businessHour: IBusinessHourBehavior) {
		this.setBusinessHourBehavior(businessHour);
	}

	setBusinessHourBehavior(businessHour: IBusinessHourBehavior): void {
		this.registerBusinessHourBehavior(businessHour);
	}

	registerBusinessHourBehavior(behavior: IBusinessHourBehavior): void {
		this.behavior = behavior;
	}

	getTemplate(): string {
		return this.behavior.getView();
	}

	shouldShowCustomTemplate(businessHourData: ILivechatBusinessHour): boolean {
		return this.behavior.shouldShowCustomTemplate(businessHourData);
	}

	shouldShowBackButton(): boolean {
		return this.behavior.shouldShowBackButton();
	}
}

export const businessHourManager = new BusinessHoursManager(new SingleBusinessHourBehavior());
