import { Meteor } from 'meteor/meteor';

import { IBusinessHour } from './IBusinessHour';
import { SingleBusinessHour } from './Single';
import { callbacks } from '../../../../../callbacks/client';

class BusinessHoursManager {
	private businessHour: IBusinessHour;

	onStartBusinessHourManager(businessHour: IBusinessHour): void {
		this.registerBusinessHour(businessHour);
	}

	registerBusinessHour(businessHour: IBusinessHour): void {
		this.businessHour = businessHour;
	}

	getTemplate(): string {
		return this.businessHour.getView();
	}
}

export const businessHourManager = new BusinessHoursManager();

Meteor.startup(() => {
	const { BusinessHourClass } = callbacks.run('on-business-hour-start', { BusinessHourClass: SingleBusinessHour });
	businessHourManager.onStartBusinessHourManager(new BusinessHourClass() as IBusinessHour);
});
