import { ILivechatBusinessHour } from '../../../../definition/ILivechatBusinessHour';

export interface IBusinessHoursManager {
	saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void>;
	getBusinessHour(id?: string): Promise<ILivechatBusinessHour>;
}

export interface IBusinessHour {
	saveBusinessHour(businessHourData: ILivechatBusinessHour): void;
	getBusinessHour(id: string): Promise<ILivechatBusinessHour>;
}

export class BusinessHourManager implements IBusinessHoursManager {
	private businessHour: IBusinessHour;

	constructor(businessHour: IBusinessHour) {
		this.registerBusinessHourMethod(businessHour);
	}

	registerBusinessHourMethod(businessHour: IBusinessHour): void {
		this.businessHour = businessHour;
	}

	async saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void> {
		this.businessHour.saveBusinessHour(businessHourData);
	}

	async getBusinessHour(id?: string): Promise<ILivechatBusinessHour> {
		return this.businessHour.getBusinessHour(id as string);
	}
}
