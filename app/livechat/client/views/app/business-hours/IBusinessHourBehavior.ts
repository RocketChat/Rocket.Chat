import { ILivechatBusinessHour } from '../../../../../../definition/ILivechatBusinessHour';

export interface IBusinessHourBehavior {
	getView(): string;
	shouldShowCustomTemplate(businessHourData: ILivechatBusinessHour): boolean;
	shouldShowBackButton(): boolean;
}
