interface IBusinessHoursManager {
	getTemplate(): string;
	registerBusinessHour(businessHour: IBusinessHour): void;
}

export interface IBusinessHour {
	getView(): string;
}

class BusinessHoursManager implements IBusinessHoursManager {
	private businessHour: IBusinessHour;

	constructor(businessHour: IBusinessHour) {
		this.registerBusinessHour(businessHour);
	}

	registerBusinessHour(businessHour: IBusinessHour): void {
		this.businessHour = businessHour;
	}

	getTemplate(): string {
		return this.businessHour.getView();
	}
}

class Single implements IBusinessHour {
	getView(): string {
		return 'livechatBusinessHoursForm';
	}
}

export const businessHourManager: IBusinessHoursManager = new BusinessHoursManager(new Single());
