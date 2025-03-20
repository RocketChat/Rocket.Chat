import { ILivechatAgentStatus, LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import { LivechatBusinessHours, Users } from '@rocket.chat/models';

import type { IBusinessHourBehavior } from './AbstractBusinessHour';
import { AbstractBusinessHourBehavior } from './AbstractBusinessHour';
import { filterBusinessHoursThatMustBeOpened, makeAgentsUnavailableBasedOnBusinessHour, openBusinessHourDefault } from './Helper';
import { notifyOnUserChange } from '../../../lib/server/lib/notifyListener';
import { businessHourLogger } from '../lib/logger';

export class SingleBusinessHourBehavior extends AbstractBusinessHourBehavior implements IBusinessHourBehavior {
	async openBusinessHoursByDayAndHour(): Promise<void> {
		return openBusinessHourDefault();
	}

	async closeBusinessHoursByDayAndHour(day: string, hour: string): Promise<void> {
		const businessHoursIds = (
			await this.BusinessHourRepository.findActiveBusinessHoursToClose(day, hour, LivechatBusinessHourTypes.DEFAULT, {
				projection: { _id: 1 },
			})
		).map((businessHour) => businessHour._id);
		await this.UsersRepository.closeAgentsBusinessHoursByBusinessHourIds(businessHoursIds);

		await makeAgentsUnavailableBasedOnBusinessHour();
	}

	async onStartBusinessHours(): Promise<void> {
		return openBusinessHourDefault();
	}

	async onNewAgentCreated(agentId: string): Promise<void> {
		const defaultBusinessHour = await LivechatBusinessHours.findOneDefaultBusinessHour();
		if (!defaultBusinessHour) {
			businessHourLogger.debug('No default business hour found for agentId', {
				agentId,
			});
			return;
		}

		const businessHourToOpen = await filterBusinessHoursThatMustBeOpened([defaultBusinessHour]);
		if (!businessHourToOpen.length) {
			businessHourLogger.debug({
				msg: 'No business hours found. Moving agent to NOT_AVAILABLE status',
				agentId,
				newStatus: ILivechatAgentStatus.NOT_AVAILABLE,
			});

			const { modifiedCount } = await Users.setLivechatStatus(agentId, ILivechatAgentStatus.NOT_AVAILABLE);
			if (modifiedCount > 0) {
				void notifyOnUserChange({
					id: agentId,
					clientAction: 'updated',
					diff: {
						statusLivechat: ILivechatAgentStatus.NOT_AVAILABLE,
						livechatStatusSystemModified: false,
					},
				});
			}

			return;
		}

		await Users.addBusinessHourByAgentIds([agentId], defaultBusinessHour._id);

		businessHourLogger.debug({
			msg: 'Business hours found. Moving agent to AVAILABLE status',
			agentId,
			newStatus: ILivechatAgentStatus.AVAILABLE,
		});
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
