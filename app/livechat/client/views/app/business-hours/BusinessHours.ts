import { Meteor } from 'meteor/meteor';

import { IBusinessHour } from './IBusinessHour';
import { SingleBusinessHour } from './Single';
import { callbacks } from '../../../../../callbacks/client';
import { ILivechatBusinessHour } from '../../../../../../definition/ILivechatBusinessHour';

class BusinessHoursManager {
	private businessHour: IBusinessHour;

	onStartBusinessHourManager(businessHour: IBusinessHour): void {
		this.registerBusinessHourMethod(businessHour);
	}

	registerBusinessHourMethod(businessHour: IBusinessHour): void {
		this.businessHour = businessHour;
	}

	getTemplate(): string {
		return this.businessHour.getView();
	}

	shouldShowCustomTemplate(businessHourData: ILivechatBusinessHour): boolean {
		return this.businessHour.shouldShowCustomTemplate(businessHourData);
	}

	shouldShowBackButton(): boolean {
		return this.businessHour.shouldShowBackButton();
	}
}

export const businessHourManager = new BusinessHoursManager();

Meteor.startup(() => {
	const { BusinessHourClass } = callbacks.run('on-business-hour-start', { BusinessHourClass: SingleBusinessHour });
	businessHourManager.onStartBusinessHourManager(new BusinessHourClass() as IBusinessHour);
});
