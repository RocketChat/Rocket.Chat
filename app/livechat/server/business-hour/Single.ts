import moment from 'moment';

import { ILivechatBusinessHour, LivechatBussinessHourTypes } from '../../../../definition/ILivechatBusinessHour';
import { AbstractBusinessHourBehavior, IBusinessHour, IBusinessHourBehavior } from './AbstractBusinessHour';
import { findBusinessHoursThatMustBeOpened, openBusinessHourDefault } from './Helper';

export class SingleBusinessHourBehavior extends AbstractBusinessHourBehavior implements IBusinessHourBehavior {
	async openBusinessHoursByDayAndHour(day: string, hour: string): Promise<void> {
		const businessHoursIds = (await this.BusinessHourRepository.findActiveBusinessHoursToOpen(day, hour, LivechatBussinessHourTypes.DEFAULT, { fields: { _id: 1 } })).map((businessHour) => businessHour._id);
		this.UsersRepository.openAgentsBusinessHoursByBusinessHourId(businessHoursIds);
	}

	async closeBusinessHoursByDayAndHour(day: string, hour: string): Promise<void> {
		const businessHoursIds = (await this.BusinessHourRepository.findActiveBusinessHoursToClose(day, hour, LivechatBussinessHourTypes.DEFAULT, { fields: { _id: 1 } })).map((businessHour) => businessHour._id);
		await this.UsersRepository.closeAgentsBusinessHoursByBusinessHourIds(businessHoursIds);
		this.UsersRepository.updateLivechatStatusBasedOnBusinessHours();
	}

	async onStartBusinessHours(): Promise<void> {
		return openBusinessHourDefault();
	}

	afterSaveBusinessHours(): Promise<void> {
		return openBusinessHourDefault();
	}

	removeBusinessHourById(): Promise<void> {
		return Promise.resolve();
	}

	onAddAgentToDepartment(): Promise<any> {
		return Promise.resolve();
	}

	onRemoveAgentFromDepartment(): Promise<void> {
		return Promise.resolve();
	}

	onRemoveDepartment(): Promise<void> {
		return Promise.resolve();
	}
}

//
// import moment from 'moment';
//
// import { ILivechatBusinessHour, LivechatBussinessHourTypes } from '../../../../definition/ILivechatBusinessHour';
// import { AbstractBusinessHour, IBusinessHour } from './AbstractBusinessHour';
//
// export class SingleBusinessHour extends AbstractBusinessHour implements IBusinessHour {
// 	async saveBusinessHour(businessHourData: any): Promise<void> {
// 		if (!businessHourData._id) {
// 			return;
// 		}
// 		businessHourData = this.convertWorkHoursWithServerTimezone(businessHourData);
// 		businessHourData.timezone = {
// 			name: '',
// 			utc: String(moment().utcOffset() / 60),
// 		};
// 		await this.BusinessHourRepository.updateOne(businessHourData._id, businessHourData);
// 	}
//
// 	getBusinessHour(): Promise<ILivechatBusinessHour> {
// 		return this.BusinessHourRepository.findOneDefaultBusinessHour();
// 	}
//
// 	async openBusinessHoursByDayHour(day: string, hour: string): Promise<void> {
// 		const businessHoursIds = (await this.BusinessHourRepository.findActiveBusinessHoursToOpen(day, hour, LivechatBussinessHourTypes.SINGLE, { fields: { _id: 1 } })).map((businessHour) => businessHour._id);
// 		this.UsersRepository.openAgentsBusinessHours(businessHoursIds);
// 	}
//
// 	async closeBusinessHoursByDayAndHour(day: string, hour: string): Promise<void> {
// 		const businessHoursIds = (await this.BusinessHourRepository.findActiveBusinessHoursToClose(day, hour, LivechatBussinessHourTypes.SINGLE, { fields: { _id: 1 } })).map((businessHour) => businessHour._id);
// 		await this.UsersRepository.closeAgentsBusinessHours(businessHoursIds);
// 		this.UsersRepository.updateLivechatStatusBasedOnBusinessHours();
// 	}
//
// 	async openBusinessHoursIfNeeded(): Promise<void> {
// 		await this.removeBusinessHoursFromUsers();
// 		const currentTime = moment(moment().format('dddd:HH:mm'), 'dddd:HH:mm');
// 		const day = currentTime.format('dddd');
// 		const activeBusinessHours = await this.BusinessHourRepository.findDefaultActiveAndOpenBusinessHoursByDay(day, {
// 			fields: {
// 				workHours: 1,
// 				timezone: 1,
// 				type: 1,
// 			},
// 		});
// 		const businessHoursToOpenIds = (await this.getBusinessHoursThatMustBeOpened(currentTime, activeBusinessHours)).map((businessHour) => businessHour._id);
// 		await this.UsersRepository.openAgentsBusinessHours(businessHoursToOpenIds);
// 		await this.UsersRepository.updateLivechatStatusBasedOnBusinessHours();
// 	}
//
// 	removeBusinessHourFromUsers(): Promise<void> {
// 		return Promise.resolve();
// 	}
//
// 	removeBusinessHourById(): Promise<void> {
// 		return Promise.resolve();
// 	}
//
// 	removeBusinessHourFromUsersByIds(): Promise<void> {
// 		return Promise.resolve();
// 	}
//
// 	addBusinessHourToUsersByIds(): Promise<void> {
// 		return Promise.resolve();
// 	}
//
// 	setDefaultToUsersIfNeeded(): Promise<void> {
// 		return Promise.resolve();
// 	}
// }
