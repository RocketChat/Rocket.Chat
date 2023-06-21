import moment from 'moment';
import { LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import type { ILivechatDepartment, ILivechatBusinessHour } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatDepartmentAgents, Users } from '@rocket.chat/models';

import type { IBusinessHourBehavior } from '../../../../../app/livechat/server/business-hour/AbstractBusinessHour';
import { AbstractBusinessHourBehavior } from '../../../../../app/livechat/server/business-hour/AbstractBusinessHour';
import {
	filterBusinessHoursThatMustBeOpened,
	filterBusinessHoursThatMustBeOpenedByDay,
} from '../../../../../app/livechat/server/business-hour/Helper';
import { closeBusinessHour, openBusinessHour, removeBusinessHourByAgentIds } from './Helper';
import { bhLogger } from '../lib/logger';
import { settings } from '../../../../../app/settings/server';
import { businessHourManager } from '../../../../../app/livechat/server/business-hour';

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

	async onAddAgentToDepartment(options: Record<string, any> = {}): Promise<any> {
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

	async onDepartmentDisabled(department: ILivechatDepartment): Promise<void> {
		if (!department.businessHourId) {
			bhLogger.error(`onDepartmentDisabled: department ${department._id} has no business hour`);
			return;
		}

		// Get business hour
		let businessHour = await this.BusinessHourRepository.findOneById(department.businessHourId);
		if (!businessHour) {
			bhLogger.error(`onDepartmentDisabled: business hour ${department.businessHourId} not found`);
			return;
		}

		// Unlink business hour from department
		await LivechatDepartment.removeBusinessHourFromDepartmentsByIdsAndBusinessHourId([department._id], businessHour._id);

		// cleanup user's cache for default business hour and this business hour
		const defaultBH = await this.BusinessHourRepository.findOneDefaultBusinessHour();
		if (!defaultBH) {
			throw new Error('Default business hour not found');
		}
		await this.UsersRepository.closeAgentsBusinessHoursByBusinessHourIds([businessHour._id, defaultBH._id]);

		// If i'm the only one, disable the business hour
		const imTheOnlyOne = !(await LivechatDepartment.countByBusinessHourIdExcludingDepartmentId(businessHour._id, department._id));
		if (imTheOnlyOne) {
			bhLogger.warn(
				`onDepartmentDisabled: department ${department._id} is the only one on business hour ${businessHour._id}, disabling it`,
			);
			await this.BusinessHourRepository.disableBusinessHour(businessHour._id);

			businessHour = await this.BusinessHourRepository.findOneById(department.businessHourId);
			if (!businessHour) {
				throw new Error(`Business hour ${department.businessHourId} not found`);
			}
		}

		// start default business hour and this BH if needed
		if (!settings.get('Livechat_enable_business_hours')) {
			bhLogger.error(`onDepartmentDisabled: business hours are disabled. skipping`);
			return;
		}
		const businessHourToOpen = await filterBusinessHoursThatMustBeOpened([businessHour, defaultBH]);
		for await (const bh of businessHourToOpen) {
			bhLogger.error(`onDepartmentDisabled: opening business hour ${bh._id}`);
			await openBusinessHour(bh, false);
		}

		await Users.updateLivechatStatusBasedOnBusinessHours();

		await businessHourManager.restartCronJobsIfNecessary();

		bhLogger.error(`onDepartmentDisabled: successfully processed department ${department._id} disabled event`);
	}

	async onDepartmentArchived(department: Pick<ILivechatDepartment, '_id'>): Promise<void> {
		bhLogger.error('Processing department archived event on business hours', department);
		const dbDepartment = await LivechatDepartment.findOneById(department._id, { projection: { businessHourId: 1, _id: 1 } });

		if (!dbDepartment) {
			bhLogger.error(`No department found with id: ${department._id} when archiving it`);
			return;
		}

		return this.onDepartmentDisabled(dbDepartment);
	}

	async allowAgentChangeServiceStatus(agentId: string): Promise<boolean> {
		const isWithinBushinessHours = await this.UsersRepository.isAgentWithinBusinessHours(agentId);
		if (isWithinBushinessHours) {
			return true;
		}

		bhLogger.debug(`No active business hour found for agent with id: ${agentId} based on user's cache. Attempting to recheck the status`);

		// double check to see if user is actually within business hours
		// this is required since the cache of businessHour Ids we maintain within user's collection might be stale
		// in many scenario's like, if the agent is created when a business is active,
		// or if a normal user is converted to agent when a business hour is active
		const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm');
		const day = currentTime.format('dddd');
		const allActiveBusinessHoursForEntireWeek = await this.BusinessHourRepository.findActiveBusinessHours({
			projection: {
				workHours: 1,
				timezone: 1,
				type: 1,
				active: 1,
			},
		});
		const openedBusinessHours = await filterBusinessHoursThatMustBeOpenedByDay(allActiveBusinessHoursForEntireWeek, day);
		if (!openedBusinessHours.length) {
			bhLogger.debug(`Business hour status recheck failed for agentId: ${agentId}. No opened business hour found`);
			return false;
		}

		const agentDepartments = await LivechatDepartmentAgents.find(
			{ departmentEnabled: true, agentId },
			{ projection: { agentId: 1, departmentId: 1 } },
		).toArray();

		if (agentDepartments.length) {
			// check if any one these departments have a opened business hour linked to it
			const departments = await LivechatDepartment.findInIds(
				agentDepartments.map(({ departmentId }) => departmentId),
				{ projection: { _id: 1, businessHourId: 1 } },
			).toArray();

			const departmentsWithActiveBH = departments.filter(
				({ businessHourId }) => businessHourId && openedBusinessHours.findIndex(({ _id }) => _id === businessHourId) !== -1,
			);

			if (!departmentsWithActiveBH.length) {
				bhLogger.debug(
					`No opened business hour found for any of the departments connected to the agent with id: ${agentId}. Now, checking if the default business hour can be used`,
				);

				// check if this agent has any departments that is connected to any non-default business hour
				// if no such departments found then check default BH and if it is active, then allow the agent to change service status
				const hasAtLeastOneDepartmentWithNonDefaultBH = departments.some(({ businessHourId }) => {
					// check if business hour is active
					return businessHourId && allActiveBusinessHoursForEntireWeek.findIndex(({ _id }) => _id === businessHourId) !== -1;
				});
				if (!hasAtLeastOneDepartmentWithNonDefaultBH) {
					const isDefaultBHActive = openedBusinessHours.find(({ type }) => type === LivechatBusinessHourTypes.DEFAULT);
					if (isDefaultBHActive?._id) {
						await this.UsersRepository.openAgentBusinessHoursByBusinessHourIdsAndAgentId([isDefaultBHActive._id], agentId);

						bhLogger.debug(`Business hour status recheck passed for agentId: ${agentId}. Found default business hour to be active`);
						return true;
					}
					bhLogger.debug(`Business hour status recheck failed for agentId: ${agentId}. Found default business hour to be inactive`);
				}
				return false;
			}

			const activeBusinessHoursForAgent = departmentsWithActiveBH.map(({ businessHourId }) => businessHourId);
			await this.UsersRepository.openAgentBusinessHoursByBusinessHourIdsAndAgentId(activeBusinessHoursForAgent, agentId);

			bhLogger.debug(
				`Business hour status recheck passed for agentId: ${agentId}. Found following business hours to be active:`,
				activeBusinessHoursForAgent,
			);
			return true;
		}

		// check if default businessHour is active
		const isDefaultBHActive = openedBusinessHours.find(({ type }) => type === LivechatBusinessHourTypes.DEFAULT);
		if (isDefaultBHActive?._id) {
			await this.UsersRepository.openAgentBusinessHoursByBusinessHourIdsAndAgentId([isDefaultBHActive._id], agentId);

			bhLogger.debug(`Business hour status recheck passed for agentId: ${agentId}. Found default business hour to be active`);
			return true;
		}

		bhLogger.debug(`Business hour status recheck failed for agentId: ${agentId}. No opened business hour found`);

		return false;
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

	private async openBusinessHour(businessHour: Record<string, any>): Promise<void> {
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

	private async closeBusinessHour(businessHour: Record<string, any>): Promise<void> {
		await closeBusinessHour(businessHour);
	}
}
