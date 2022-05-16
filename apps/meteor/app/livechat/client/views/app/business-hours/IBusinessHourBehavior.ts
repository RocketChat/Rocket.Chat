import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';

export interface IBusinessHourBehavior {
	getView(): string;
	showCustomTemplate(businessHourData: ILivechatBusinessHour): boolean;
	showBackButton(): boolean;
	showTimezoneTemplate(): boolean;
}
