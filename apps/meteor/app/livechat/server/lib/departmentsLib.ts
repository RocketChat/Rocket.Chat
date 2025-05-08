import { AppEvents, Apps } from '@rocket.chat/apps';
import type { LivechatDepartmentDTO, ILivechatDepartment, ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatDepartmentAgents, LivechatVisitors, LivechatRooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { updateDepartmentAgents } from './Helper';
import { isDepartmentCreationAvailable } from './isDepartmentCreationAvailable';
import { livechatLogger } from './logger';
import { callbacks } from '../../../../lib/callbacks';
import {
	notifyOnLivechatDepartmentAgentChangedByDepartmentId,
	notifyOnLivechatDepartmentAgentChanged,
} from '../../../lib/server/lib/notifyListener';
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
		remove?: { agentId: string; count?: number; order?: number };
	},
	departmentUnit?: { _id?: string },
) {
	check(_id, Match.Maybe(String));
	if (departmentUnit?._id !== undefined && typeof departmentUnit._id !== 'string') {
		throw new Meteor.Error('error-invalid-department-unit', 'Invalid department unit id provided', {
			method: 'livechat:saveDepartment',
		});
	}

	const department = _id
		? await LivechatDepartment.findOneById(_id, { projection: { _id: 1, archived: 1, enabled: 1, parentId: 1 } })
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
		const fallbackDep = await LivechatDepartment.findOneById(fallbackForwardDepartment, {
			projection: { _id: 1, fallbackForwardDepartment: 1 },
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

	await Promise.all([LivechatDepartmentAgents.disableAgentsByDepartmentId(_id), LivechatDepartment.archiveDepartment(_id)]);

	void notifyOnLivechatDepartmentAgentChangedByDepartmentId(_id);

	await callbacks.run('livechat.afterDepartmentArchived', department);
}

export async function unarchiveDepartment(_id: string) {
	const department = await LivechatDepartment.findOneById(_id, { projection: { _id: 1 } });

	if (!department) {
		throw new Meteor.Error('department-not-found');
	}

	// TODO: these kind of actions should be on events instead of here
	await Promise.all([LivechatDepartmentAgents.enableAgentsByDepartmentId(_id), LivechatDepartment.unarchiveDepartment(_id)]);

	void notifyOnLivechatDepartmentAgentChangedByDepartmentId(_id);

	return true;
}

export async function saveDepartmentAgents(
	_id: string,
	departmentAgents: {
		upsert?: Pick<ILivechatDepartmentAgents, 'agentId' | 'count' | 'order' | 'username'>[];
		remove?: Pick<ILivechatDepartmentAgents, 'agentId'>[];
	},
) {
	check(_id, String);
	check(departmentAgents, {
		upsert: Match.Maybe([
			Match.ObjectIncluding({
				agentId: String,
				username: String,
				count: Match.Maybe(Match.Integer),
				order: Match.Maybe(Match.Integer),
			}),
		]),
		remove: Match.Maybe([
			Match.ObjectIncluding({
				agentId: String,
				username: Match.Maybe(String),
				count: Match.Maybe(Match.Integer),
				order: Match.Maybe(Match.Integer),
			}),
		]),
	});

	const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, 'enabled'>>(_id, { projection: { enabled: 1 } });
	if (!department) {
		throw new Meteor.Error('error-department-not-found', 'Department not found');
	}

	return updateDepartmentAgents(_id, departmentAgents, department.enabled);
}

export async function setDepartmentForGuest({ token, department }: { token: string; department: string }) {
	check(token, String);
	check(department, String);

	livechatLogger.debug(`Switching departments for user with token ${token} (to ${department})`);

	const updateUser = {
		$set: {
			department,
		},
	};

	const dep = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id'>>(department, { projection: { _id: 1 } });
	if (!dep) {
		throw new Meteor.Error('invalid-department', 'Provided department does not exists');
	}

	const visitor = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });
	if (!visitor) {
		throw new Meteor.Error('invalid-token', 'Provided token is invalid');
	}
	await LivechatVisitors.updateById(visitor._id, updateUser);
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

	livechatLogger.debug(
		`Performing post-department-removal actions: ${_id}. Removing department agents, unsetting fallback department and removing department from rooms`,
	);

	const removeByDept = LivechatDepartmentAgents.removeByDepartmentId(_id);

	const promiseResponses = await Promise.allSettled([
		removeByDept,
		LivechatDepartment.unsetFallbackDepartmentByDepartmentId(_id),
		LivechatRooms.bulkRemoveDepartmentAndUnitsFromRooms(_id),
	]);

	promiseResponses.forEach((response, index) => {
		if (response.status === 'rejected') {
			livechatLogger.error(`Error while performing post-department-removal actions: ${_id}. Action No: ${index}. Error:`, response.reason);
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
	const departments = LivechatDepartment.findEnabledWithAgents();

	for await (const dept of departments) {
		if (!dept.showOnRegistration) {
			continue;
		}
		if (!onlineRequired) {
			return dept;
		}

		const onlineAgents = await LivechatDepartmentAgents.countOnlineForDepartment(dept._id);
		if (onlineAgents) {
			return dept;
		}
	}
}
