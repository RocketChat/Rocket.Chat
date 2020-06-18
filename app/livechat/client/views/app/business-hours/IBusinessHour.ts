import { ILivechatBusinessHour } from '../../../../../../definition/ILivechatBusinessHour';

export interface IBusinessHour {
	getView(): string;
	shouldShowCustomTemplate(businessHourData: ILivechatBusinessHour): boolean;
	shouldShowBackButton(): boolean;
}
