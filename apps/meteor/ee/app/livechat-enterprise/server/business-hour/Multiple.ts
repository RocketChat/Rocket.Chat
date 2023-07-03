import moment from 'moment';
import type { ILivechatDepartment, ILivechatBusinessHour } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatDepartmentAgents } from '@rocket.chat/models';

import type { IBusinessHourBehavior } from '../../../../../app/livechat/server/business-hour/AbstractBusinessHour';
import { AbstractBusinessHourBehavior } from '../../../../../app/livechat/server/business-hour/AbstractBusinessHour';
import { filterBusinessHoursThatMustBeOpened } from '../../../../../app/livechat/server/business-hour/Helper';
import { closeBusinessHour, openBusinessHour, removeBusinessHourByAgentIds } from './Helper';
import { businessHourLogger } from '../../../../../app/livechat/server/lib/logger';

interface IBusinessHoursExtraProperties extends ILivechatBusinessHour {
	timezoneName: string;
	departmentsToApplyBusinessHour: string;
}

export class MultipleBusinessHoursBehavior extends AbstractBusinessHourBehavior implements IBusinessHourBehavior {
	constructor() {
		super();
		this.onAddAgentToDepartment = this.onAddAgentToDepartment.bind(this);
		this.onRemoveAgentFromDepartment = this.onRemoveAgentFromDepartment.bind(this);
		this.onRemoveDepartment = this.onRemoveDepartment.bind(this);
		this.onNewAgentCreated = this.onNewAgentCreated.bind(this);
	}

	async onStartBusinessHours(): Promise<void> {
		await this.UsersRepository.removeBusinessHoursFromAllUsers();
		await this.UsersRepository.updateLivechatStatusBasedOnBusinessHours();
		const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm');
		const day = currentTime.format('dddd');
		const activeBusinessHours = await this.BusinessHourRepository.findActiveAndOpenBusinessHoursByDay(day, {
			projection: {
				workHours: 1,
				timezone: 1,
				type: 1,
				active: 1,
			},
		});
		const businessHoursToOpen = await filterBusinessHoursThatMustBeOpened(activeBusinessHours);
		businessHourLogger.debug({
			msg: 'Starting Multiple Business Hours',
			totalBusinessHoursToOpen: businessHoursToOpen.length,
			top10BusinessHoursToOpen: businessHoursToOpen.slice(0, 10),
		});
		for (const businessHour of businessHoursToOpen) {
			void this.openBusinessHour(businessHour);
		}
	}

	async openBusinessHoursByDayAndHour(day: string, hour: string): Promise<void> {
		const businessHours = await this.BusinessHourRepository.findActiveBusinessHoursToOpen(day, hour, undefined, {
			projection: {
				_id: 1,
				type: 1,
			},
		});
		for (const businessHour of businessHours) {
			void this.openBusinessHour(businessHour);
		}
	}

	async closeBusinessHoursByDayAndHour(day: string, hour: string): Promise<void> {
		const businessHours = await this.BusinessHourRepository.findActiveBusinessHoursToClose(day, hour, undefined, {
			projection: {
				_id: 1,
				type: 1,
			},
		});
		for (const businessHour of businessHours) {
			void this.closeBusinessHour(businessHour);
		}
	}

	async afterSaveBusinessHours(businessHourData: IBusinessHoursExtraProperties): Promise<void> {
		const departments = businessHourData.departmentsToApplyBusinessHour?.split(',').filter(Boolean);
		const currentDepartments = businessHourData.departments?.map((dept: any) => dept._id);
		const toRemove = [...(currentDepartments || []).filter((dept: Record<string, any>) => !departments.includes(dept._id))];
		await this.removeBusinessHourFromRemovedDepartmentsUsersIfNeeded(businessHourData._id, toRemove);
		const businessHour = await this.BusinessHourRepository.findOneById(businessHourData._id);
		if (!businessHour) {
			return;
		}
		const businessHourIdToOpen = (await filterBusinessHoursThatMustBeOpened([businessHour])).map((businessHour) => businessHour._id);
		if (!businessHourIdToOpen.length) {
			return closeBusinessHour(businessHour);
		}
		return openBusinessHour(businessHour);
	}

	async onAddAgentToDepartment(options: { departmentId: string; agentsId: string[] }): Promise<any> {
		const { departmentId, agentsId } = options;
		const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, 'businessHourId'>>(departmentId, {
			projection: { businessHourId: 1 },
		});
		if (!department || !agentsId.length) {
			return options;
		}
		const defaultBusinessHour = await this.BusinessHourRepository.findOneDefaultBusinessHour();
		if (!defaultBusinessHour) {
			return options;
		}
		await removeBusinessHourByAgentIds(agentsId, defaultBusinessHour._id);
		if (!department.businessHourId) {
			return options;
		}
		const businessHour = await this.BusinessHourRepository.findOneById(department.businessHourId);
		if (!businessHour) {
			return options;
		}
		const businessHourToOpen = await filterBusinessHoursThatMustBeOpened([businessHour]);
		if (!businessHourToOpen.length) {
			return options;
		}
		await this.UsersRepository.addBusinessHourByAgentIds(agentsId, businessHour._id);
		return options;
	}

	async onRemoveAgentFromDepartment(options: Record<string, any> = {}): Promise<any> {
		const { departmentId, agentsId } = options;
		const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, 'businessHourId'>>(departmentId, {
			projection: { businessHourId: 1 },
		});
		if (!department || !agentsId.length) {
			return options;
		}
		return this.handleRemoveAgentsFromDepartments(department, agentsId, options);
	}

	async onRemoveDepartment(options: Record<string, any> = {}): Promise<any> {
		const { department, agentsIds } = options;
		if (!department || !agentsIds?.length) {
			return options;
		}
		const deletedDepartment = LivechatDepartment.trashFindOneById(department._id);
		return this.handleRemoveAgentsFromDepartments(deletedDepartment, agentsIds, options);
	}

	allowAgentChangeServiceStatus(agentId: string): Promise<boolean> {
		return this.UsersRepository.isAgentWithinBusinessHours(agentId);
	}

	private async handleRemoveAgentsFromDepartments(department: Record<string, any>, agentsIds: string[], options: any): Promise<any> {
		const agentIdsWithoutDepartment: string[] = [];
		const agentIdsToRemoveCurrentBusinessHour: string[] = [];
		for await (const agentId of agentsIds) {
			if ((await LivechatDepartmentAgents.findByAgentId(agentId).count()) === 0) {
				agentIdsWithoutDepartment.push(agentId);
			}
			// TODO: We're doing a full fledged aggregation with lookups and getting the whole array just for getting the length? :(
			if (!(await LivechatDepartmentAgents.findAgentsByAgentIdAndBusinessHourId(agentId, department.businessHourId)).length) {
				// eslint-disable-line no-await-in-loop
				agentIdsToRemoveCurrentBusinessHour.push(agentId);
			}
		}
		if (department.businessHourId) {
			await removeBusinessHourByAgentIds(agentIdsToRemoveCurrentBusinessHour, department.businessHourId);
		}
		if (!agentIdsWithoutDepartment.length) {
			return options;
		}
		const defaultBusinessHour = await this.BusinessHourRepository.findOneDefaultBusinessHour();
		if (!defaultBusinessHour) {
			return options;
		}
		const businessHourToOpen = await filterBusinessHoursThatMustBeOpened([defaultBusinessHour]);
		if (!businessHourToOpen.length) {
			return options;
		}
		await this.UsersRepository.addBusinessHourByAgentIds(agentIdsWithoutDepartment, defaultBusinessHour._id);
		return options;
	}

	private async openBusinessHour(businessHour: Pick<ILivechatBusinessHour, '_id' | 'type'>): Promise<void> {
		return openBusinessHour(businessHour);
	}

	private async removeBusinessHourFromRemovedDepartmentsUsersIfNeeded(
		businessHourId: string,
		departmentsToRemove: string[],
	): Promise<void> {
		if (!departmentsToRemove.length) {
			return;
		}
		const agentIds = (await LivechatDepartmentAgents.findByDepartmentIds(departmentsToRemove).toArray()).map((dept: any) => dept.agentId);
		await removeBusinessHourByAgentIds(agentIds, businessHourId);
	}

	private async closeBusinessHour(businessHour: Pick<ILivechatBusinessHour, '_id' | 'type'>): Promise<void> {
		await closeBusinessHour(businessHour);
	}
}
