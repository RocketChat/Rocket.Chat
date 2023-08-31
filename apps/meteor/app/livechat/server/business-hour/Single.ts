import { LivechatBusinessHourTypes } from '@rocket.chat/core-typings';

import { businessHourLogger } from '../lib/logger';
import type { IBusinessHourBehavior } from './AbstractBusinessHour';
import { AbstractBusinessHourBehavior } from './AbstractBusinessHour';
import { openBusinessHourDefault } from './Helper';

export class SingleBusinessHourBehavior extends AbstractBusinessHourBehavior implements IBusinessHourBehavior {
	async openBusinessHoursByDayAndHour(): Promise<void> {
		businessHourLogger.debug('opening single business hour');
		return openBusinessHourDefault();
	}

	async closeBusinessHoursByDayAndHour(day: string, hour: string): Promise<void> {
		const businessHoursIds = (
			await this.BusinessHourRepository.findActiveBusinessHoursToClose(day, hour, LivechatBusinessHourTypes.DEFAULT, {
				projection: { _id: 1 },
			})
		).map((businessHour) => businessHour._id);
		await this.UsersRepository.closeAgentsBusinessHoursByBusinessHourIds(businessHoursIds);
		await this.UsersRepository.updateLivechatStatusBasedOnBusinessHours();
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
