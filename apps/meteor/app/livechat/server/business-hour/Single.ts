import { LivechatBusinessHourTypes } from '@rocket.chat/core-typings';

import type { IBusinessHourBehavior } from './AbstractBusinessHour';
import { AbstractBusinessHourBehavior } from './AbstractBusinessHour';
import { openBusinessHourDefault } from './Helper';
import { businessHourLogger } from '../lib/logger';

export class SingleBusinessHourBehavior extends AbstractBusinessHourBehavior implements IBusinessHourBehavior {
	async openBusinessHoursByDayAndHour(day: string, hour: string): Promise<void> {
		const businessHoursIds = (
			await this.BusinessHourRepository.findActiveBusinessHoursToOpen(day, hour, LivechatBusinessHourTypes.DEFAULT, {
				projection: { _id: 1 },
			})
		).map((businessHour) => businessHour._id);
		this.UsersRepository.openAgentsBusinessHoursByBusinessHourId(businessHoursIds);
	}

	async closeBusinessHoursByDayAndHour(day: string, hour: string): Promise<void> {
		const businessHoursIds = (
			await this.BusinessHourRepository.findActiveBusinessHoursToClose(day, hour, LivechatBusinessHourTypes.DEFAULT, {
				projection: { _id: 1 },
			})
		).map((businessHour) => businessHour._id);
		await this.UsersRepository.closeAgentsBusinessHoursByBusinessHourIds(businessHoursIds);
		this.UsersRepository.updateLivechatStatusBasedOnBusinessHours();
	}

	async onStartBusinessHours(): Promise<void> {
		businessHourLogger.debug('Starting Single Business Hours');
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

	onDepartmentDisabled(): Promise<void> {
		return Promise.resolve();
	}

	onDepartmentArchived(): Promise<void> {
		return Promise.resolve();
	}
}
