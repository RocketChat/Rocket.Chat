import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';

import type { IBusinessHourBehavior } from './IBusinessHourBehavior';
import { SingleBusinessHourBehavior } from './Single';

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

	showCustomTemplate(businessHourData: ILivechatBusinessHour): boolean {
		return this.behavior.showCustomTemplate(businessHourData);
	}

	showBackButton(): boolean {
		return this.behavior.showBackButton();
	}
}

export const businessHourManager = new BusinessHoursManager(new SingleBusinessHourBehavior());
