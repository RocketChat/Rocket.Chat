import { ILivechatBusinessHour } from '../../../../../../definition/ILivechatBusinessHour';

export interface IBusinessHourBehavior {
	getView(): string;
	showCustomTemplate(businessHourData: ILivechatBusinessHour): boolean;
	showBackButton(): boolean;
	showTimezoneTemplate(): boolean;
}
