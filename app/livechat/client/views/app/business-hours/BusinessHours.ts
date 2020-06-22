import { IBusinessHour } from './IBusinessHour';
import { SingleBusinessHour } from './Single';
import { ILivechatBusinessHour } from '../../../../../../definition/ILivechatBusinessHour';

class BusinessHoursManager {
	private businessHour: IBusinessHour;

	constructor(businessHour: IBusinessHour) {
		this.setBusinessHourManager(businessHour);
	}

	setBusinessHourManager(businessHour: IBusinessHour): void {
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

export const businessHourManager = new BusinessHoursManager(new SingleBusinessHour() as IBusinessHour);
