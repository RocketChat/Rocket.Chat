import type { LivechatDepartmentDTO, ILivechatDepartment, ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatDepartmentAgents } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { notifyOnLivechatDepartmentAgentChangedByDepartmentId } from '../../../lib/server/lib/notifyListener';
import { updateDepartmentAgents } from './Helper';
import { isDepartmentCreationAvailable } from './isDepartmentCreationAvailable';
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

	// Disable event
	if (department?.enabled && !departmentDB?.enabled) {
		await callbacks.run('livechat.afterDepartmentDisabled', departmentDB);
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
