import { AppEvents, Apps } from '@rocket.chat/apps';
import type { LivechatDepartmentDTO, ILivechatDepartment, ILivechatDepartmentAgents, ILivechatAgent } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatDepartmentAgents, LivechatVisitors, LivechatRooms, Users } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { updateDepartmentAgents } from './Helper';
import { afterDepartmentArchived, afterDepartmentUnarchived } from './hooks';
import { isDepartmentCreationAvailable } from './isDepartmentCreationAvailable';
import { livechatLogger } from './logger';
import { callbacks } from '../../../../lib/callbacks';
import {
	notifyOnLivechatDepartmentAgentChangedByDepartmentId,
	notifyOnLivechatDepartmentAgentChanged,
} from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';
/**
 * @param {string|null} _id - The department id
 * @param {Partial<import('@rocket.chat/core-typings').ILivechatDepartment>} departmentData
 * @param {{upsert?: { agentId: string; count?: number; order?: number; }[], remove?: { agentId: string; count?: number; order?: number; }}} [departmentAgents] - The department agents
 * @param {{_id?: string}} [departmentUnit] - The department's unit id
 */
export async function saveDepartment(
	userId: string,
	_id: string | null,
	departmentData: LivechatDepartmentDTO,
	departmentAgents?: {
		upsert?: { agentId: string; count?: number; order?: number }[];
		remove?: { agentId: string; count?: number; order?: number }[];
	},
	departmentUnit?: { _id?: string },
) {
	if (departmentUnit?._id !== undefined && typeof departmentUnit._id !== 'string') {
		throw new Meteor.Error('error-invalid-department-unit', 'Invalid department unit id provided', {
			method: 'livechat:saveDepartment',
		});
	}

	const department = _id
		? await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id' | 'archived' | 'enabled' | 'parentId'>>(_id, {
				projection: { _id: 1, archived: 1, enabled: 1, parentId: 1 },
			})
		: null;

	if (departmentUnit && !departmentUnit._id && department && department.parentId) {
		const isLastDepartmentInUnit = (await LivechatDepartment.countDepartmentsInUnit(department.parentId)) === 1;
		if (isLastDepartmentInUnit) {
			throw new Meteor.Error('error-unit-cant-be-empty', "The last department in a unit can't be removed", {
				method: 'livechat:saveDepartment',
			});
		}
	}

	if (!department && !(await isDepartmentCreationAvailable())) {
		throw new Meteor.Error('error-max-departments-number-reached', 'Maximum number of departments reached', {
			method: 'livechat:saveDepartment',
		});
	}

	if (department?.archived && departmentData.enabled) {
		throw new Meteor.Error('error-archived-department-cant-be-enabled', 'Archived departments cant be enabled', {
			method: 'livechat:saveDepartment',
		});
	}

	// TODO: Use AJV or Zod for validation (or the lib we are using rn)
	const defaultValidations: Record<string, Match.Matcher<any> | BooleanConstructor | StringConstructor> = {
		enabled: Boolean,
		name: String,
		description: Match.Optional(String),
		showOnRegistration: Boolean,
		email: String,
		showOnOfflineForm: Boolean,
		requestTagBeforeClosingChat: Match.Optional(Boolean),
		chatClosingTags: Match.Optional([String]),
		fallbackForwardDepartment: Match.Optional(String),
		departmentsAllowedToForward: Match.Optional([String]),
		allowReceiveForwardOffline: Match.Optional(Boolean),
	};

	// The Livechat Form department support addition/custom fields, so those fields need to be added before validating
	Object.keys(departmentData).forEach((field) => {
		if (!defaultValidations.hasOwnProperty(field)) {
			defaultValidations[field] = Match.OneOf(String, Match.Integer, Boolean);
		}
	});

	check(departmentData, defaultValidations);
	check(
		departmentAgents,
		Match.Maybe({
			upsert: Match.Maybe(Array),
			remove: Match.Maybe(Array),
		}),
	);

	const { requestTagBeforeClosingChat, chatClosingTags, fallbackForwardDepartment } = departmentData;
	if (requestTagBeforeClosingChat && (!chatClosingTags || chatClosingTags.length === 0)) {
		throw new Meteor.Error(
			'error-validating-department-chat-closing-tags',
			'At least one closing tag is required when the department requires tag(s) on closing conversations.',
			{ method: 'livechat:saveDepartment' },
		);
	}

	if (_id && !department) {
		throw new Meteor.Error('error-department-not-found', 'Department not found', {
			method: 'livechat:saveDepartment',
		});
	}

	if (fallbackForwardDepartment === _id) {
		throw new Meteor.Error(
			'error-fallback-department-circular',
			'Cannot save department. Circular reference between fallback department and department',
		);
	}

	if (fallbackForwardDepartment) {
		const fallbackDep = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id'>>(fallbackForwardDepartment, {
			projection: { _id: 1 },
		});
		if (!fallbackDep) {
			throw new Meteor.Error('error-fallback-department-not-found', 'Fallback department not found', {
				method: 'livechat:saveDepartment',
			});
		}
	}

	const departmentDB = await LivechatDepartment.createOrUpdateDepartment(_id, departmentData);
	if (departmentDB && departmentAgents) {
		await updateDepartmentAgents(departmentDB._id, departmentAgents, departmentDB.enabled);
	}

	if (department?.enabled !== departmentData.enabled) {
		void notifyOnLivechatDepartmentAgentChangedByDepartmentId(departmentDB._id, department ? 'updated' : 'inserted');
	}

	// Disable event
	if (department?.enabled && !departmentDB?.enabled) {
		await callbacks.run('livechat.afterDepartmentDisabled', departmentDB);
		void Apps.self
			?.getBridges()
			?.getListenerBridge()
			.livechatEvent(AppEvents.IPostLivechatDepartmentDisabled, { department: departmentDB });
	}

	if (departmentUnit) {
		await callbacks.run('livechat.manageDepartmentUnit', { userId, departmentId: departmentDB._id, unitId: departmentUnit._id });
	}

	return departmentDB;
}

export async function archiveDepartment(_id: string) {
	const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id' | 'businessHourId'>>(_id, {
		projection: { _id: 1, businessHourId: 1 },
	});

	if (!department) {
		throw new Error('department-not-found');
	}

	const status = await LivechatDepartment.archiveDepartment(department._id);
	if (status.modifiedCount) {
		await afterDepartmentArchived(department);
	}
}

export async function unarchiveDepartment(_id: string) {
	const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id'>>(_id, { projection: { _id: 1 } });

	if (!department) {
		throw new Meteor.Error('department-not-found');
	}

	const status = await LivechatDepartment.unarchiveDepartment(department._id);
	if (status.modifiedCount) {
		await afterDepartmentUnarchived(department);
	}
}

export async function saveDepartmentAgents(
	_id: string,
	departmentAgents: {
		upsert?: (Pick<ILivechatDepartmentAgents, 'agentId' | 'username'> & {
			count?: number;
			order?: number;
		})[];
		remove?: Pick<ILivechatDepartmentAgents, 'agentId' | 'username'>[];
	},
) {
	const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, 'enabled'>>(_id, { projection: { enabled: 1 } });
	if (!department) {
		throw new Meteor.Error('error-department-not-found', 'Department not found');
	}

	return updateDepartmentAgents(_id, departmentAgents, department.enabled);
}

export async function setDepartmentForGuest({ visitorId, department }: { visitorId: string; department: string }) {
	livechatLogger.debug({
		msg: 'Switching departments for visitor',
		visitorId,
		department,
	});

	const dep = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id'>>(department, { projection: { _id: 1 } });
	if (!dep) {
		throw new Meteor.Error('invalid-department', 'Provided department does not exists');
	}

	// Visitor is already validated at this point
	return LivechatVisitors.updateDepartmentById(visitorId, department);
}

export async function removeDepartment(departmentId: string) {
	livechatLogger.debug(`Removing department: ${departmentId}`);

	const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id' | 'businessHourId' | 'parentId'>>(departmentId, {
		projection: { _id: 1, businessHourId: 1, parentId: 1 },
	});
	if (!department) {
		throw new Error('error-department-not-found');
	}

	const { _id } = department;

	const ret = await LivechatDepartment.removeById(_id);
	if (ret.acknowledged !== true) {
		throw new Error('error-failed-to-delete-department');
	}

	const removedAgents = await LivechatDepartmentAgents.findByDepartmentId(department._id, { projection: { agentId: 1 } }).toArray();

	const actions = ['Removing department agents', 'Unsetting fallback department', 'Removing department from rooms'];
	livechatLogger.debug({
		msg: 'Post department removal actions',
		departmentId: _id,
		actions,
	});

	const promiseResponses = await Promise.allSettled([
		LivechatDepartmentAgents.removeByDepartmentId(_id),
		LivechatDepartment.unsetFallbackDepartmentByDepartmentId(_id),
		LivechatRooms.bulkRemoveDepartmentAndUnitsFromRooms(_id),
	]);

	promiseResponses.forEach((response, index) => {
		if (response.status === 'rejected') {
			livechatLogger.error({
				msg: 'Post removal action failed',
				actionId: actions[index],
				error: response.reason,
			});
		}
	});

	const { deletedCount } = promiseResponses[0].status === 'fulfilled' ? promiseResponses[0].value : { deletedCount: 0 };

	if (deletedCount > 0) {
		removedAgents.forEach(({ _id: docId, agentId }) => {
			void notifyOnLivechatDepartmentAgentChanged(
				{
					_id: docId,
					agentId,
					departmentId: _id,
				},
				'removed',
			);
		});
	}

	await callbacks.run('livechat.afterRemoveDepartment', { department, agentsIds: removedAgents.map(({ agentId }) => agentId) });
	void Apps.self?.getBridges()?.getListenerBridge().livechatEvent(AppEvents.IPostLivechatDepartmentRemoved, { department });

	return ret;
}

export async function getRequiredDepartment(onlineRequired = true) {
	if (!onlineRequired) {
		return LivechatDepartment.findOneEnabledWithAgentsAndRegistration();
	}

	const departments = LivechatDepartment.findEnabledWithAgentsAndRegistration();

	for await (const dept of departments) {
		const onlineAgents = await checkOnlineForDepartment(dept._id);
		if (onlineAgents) {
			return dept;
		}
	}
}

export async function checkOnlineForDepartment(departmentId: string) {
	const depUsers = await LivechatDepartmentAgents.findByDepartmentId(departmentId, { projection: { username: 1 } }).toArray();
	const onlineForDep = await Users.findOneOnlineAgentByUserList(
		depUsers.map((agent) => agent.username),
		{ projection: { _id: 1 } },
		settings.get<boolean>('Livechat_enabled_when_agent_idle'),
	);

	return !!onlineForDep;
}

export async function getOnlineForDepartment(departmentId: string) {
	const agents = await LivechatDepartmentAgents.findByDepartmentId(departmentId, { projection: { username: 1 } }).toArray();
	const usernames = agents.map(({ username }) => username);

	return Users.findOnlineUserFromList<ILivechatAgent>([...new Set(usernames)], settings.get<boolean>('Livechat_enabled_when_agent_idle'));
}
