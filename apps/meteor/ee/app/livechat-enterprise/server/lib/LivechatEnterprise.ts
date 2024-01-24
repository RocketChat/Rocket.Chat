import type { IOmnichannelBusinessUnit, IOmnichannelServiceLevelAgreements, LivechatDepartmentDTO } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import {
	Users,
	LivechatDepartment as LivechatDepartmentRaw,
	OmnichannelServiceLevelAgreements,
	LivechatTag,
	LivechatUnitMonitors,
	LivechatUnit,
} from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { updateDepartmentAgents } from '../../../../../app/livechat/server/lib/Helper';
import { callbacks } from '../../../../../lib/callbacks';
import { addUserRolesAsync } from '../../../../../server/lib/roles/addUserRoles';
import { removeUserFromRolesAsync } from '../../../../../server/lib/roles/removeUserFromRoles';
import { updateSLAInquiries } from './Helper';
import { removeSLAFromRooms } from './SlaHelper';

export const LivechatEnterprise = {
	async addMonitor(username: string) {
		check(username, String);

		const user = await Users.findOneByUsername(username, { projection: { _id: 1, username: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:addMonitor',
			});
		}

		if (await addUserRolesAsync(user._id, ['livechat-monitor'])) {
			return user;
		}

		return false;
	},

	async removeMonitor(username: string) {
		check(username, String);

		const user = await Users.findOneByUsername(username, { projection: { _id: 1 } });

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:removeMonitor',
			});
		}

		const removeRoleResult = await removeUserFromRolesAsync(user._id, ['livechat-monitor']);
		if (!removeRoleResult) {
			return false;
		}

		// remove this monitor from any unit it is assigned to
		await LivechatUnitMonitors.removeByMonitorId(user._id);

		return true;
	},

	async removeUnit(_id: string) {
		check(_id, String);

		const unit = await LivechatUnit.findOneById(_id, { projection: { _id: 1 } });

		if (!unit) {
			throw new Meteor.Error('unit-not-found', 'Unit not found', { method: 'livechat:removeUnit' });
		}

		return LivechatUnit.removeById(_id);
	},

	async saveUnit(
		_id: string | null,
		unitData: Omit<IOmnichannelBusinessUnit, '_id'>,
		unitMonitors: { monitorId: string; username: string },
		unitDepartments: { departmentId: string }[],
	) {
		check(_id, Match.Maybe(String));

		check(unitData, {
			name: String,
			visibility: String,
			enabled: Match.Optional(Boolean),
			description: Match.Optional(String),
			email: Match.Optional(String),
			showOnOfflineForm: Match.Optional(Boolean),
		});

		check(unitMonitors, [
			Match.ObjectIncluding({
				monitorId: String,
				username: String,
			}),
		]);

		check(unitDepartments, [
			Match.ObjectIncluding({
				departmentId: String,
			}),
		]);

		let ancestors: string[] = [];
		if (_id) {
			const unit = await LivechatUnit.findOneById(_id);
			if (!unit) {
				throw new Meteor.Error('error-unit-not-found', 'Unit not found', {
					method: 'livechat:saveUnit',
				});
			}

			ancestors = unit.ancestors || [];
		}

		const validUserMonitors = await Users.findUsersInRolesWithQuery(
			'livechat-monitor',
			{ _id: { $in: unitMonitors.map(({ monitorId }) => monitorId) } },
			{ projection: { _id: 1, username: 1 } },
		).toArray();

		const monitors = validUserMonitors.map(({ _id: monitorId, username }) => ({
			monitorId,
			username,
		})) as { monitorId: string; username: string }[];

		return LivechatUnit.createOrUpdateUnit(_id, unitData, ancestors, monitors, unitDepartments);
	},

	async removeTag(_id: string) {
		check(_id, String);

		const tag = await LivechatTag.findOneById(_id, { projection: { _id: 1, name: 1 } });

		if (!tag) {
			throw new Meteor.Error('tag-not-found', 'Tag not found', { method: 'livechat:removeTag' });
		}

		await callbacks.run('livechat.afterTagRemoved', tag);
		return LivechatTag.removeById(_id);
	},

	async saveTag(_id: string | undefined, tagData: { name: string; description?: string }, tagDepartments: string[]) {
		check(_id, Match.Maybe(String));

		check(tagData, {
			name: String,
			description: Match.Optional(String),
		});

		check(tagDepartments, [String]);

		return LivechatTag.createOrUpdateTag(_id, tagData, tagDepartments);
	},

	async saveSLA(_id: string | null, slaData: Pick<IOmnichannelServiceLevelAgreements, 'name' | 'description' | 'dueTimeInMinutes'>) {
		const oldSLA = _id && (await OmnichannelServiceLevelAgreements.findOneById(_id, { projection: { dueTimeInMinutes: 1 } }));
		const exists = await OmnichannelServiceLevelAgreements.findDuplicate(_id, slaData.name, slaData.dueTimeInMinutes);
		if (exists) {
			throw new Error('error-duplicated-sla');
		}

		const sla = await OmnichannelServiceLevelAgreements.createOrUpdatePriority(slaData, _id);
		if (!oldSLA) {
			return sla;
		}

		const { dueTimeInMinutes: oldDueTimeInMinutes } = oldSLA;
		const { dueTimeInMinutes } = sla;

		if (oldDueTimeInMinutes !== dueTimeInMinutes) {
			await updateSLAInquiries(sla);
		}

		return sla;
	},

	async removeSLA(_id: string) {
		const sla = await OmnichannelServiceLevelAgreements.findOneById(_id, { projection: { _id: 1 } });
		if (!sla) {
			throw new Error(`SLA with id ${_id} not found`);
		}

		const removedResult = await OmnichannelServiceLevelAgreements.removeById(_id);
		if (!removedResult || removedResult.deletedCount !== 1) {
			throw new Error(`Error removing SLA with id ${_id}`);
		}

		await removeSLAFromRooms(_id);
	},

	/**
	 * @param {string|null} _id - The department id
	 * @param {Partial<import('@rocket.chat/core-typings').ILivechatDepartment>} departmentData
	 * @param {{upsert?: { agentId: string; count?: number; order?: number; }[], remove?: { agentId: string; count?: number; order?: number; }}} [departmentAgents] - The department agents
	 */
	async saveDepartment(
		_id: string | null,
		departmentData: LivechatDepartmentDTO,
		departmentAgents?: {
			upsert?: { agentId: string; count?: number; order?: number }[];
			remove?: { agentId: string; count?: number; order?: number };
		},
	) {
		check(_id, Match.Maybe(String));

		const department = _id ? await LivechatDepartmentRaw.findOneById(_id, { projection: { _id: 1, archived: 1, enabled: 1 } }) : null;

		if (!License.hasModule('livechat-enterprise')) {
			const totalDepartments = await LivechatDepartmentRaw.countTotal();
			if (!department && totalDepartments >= 1) {
				throw new Meteor.Error('error-max-departments-number-reached', 'Maximum number of departments reached', {
					method: 'livechat:saveDepartment',
				});
			}
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
			const fallbackDep = await LivechatDepartmentRaw.findOneById(fallbackForwardDepartment, {
				projection: { _id: 1, fallbackForwardDepartment: 1 },
			});
			if (!fallbackDep) {
				throw new Meteor.Error('error-fallback-department-not-found', 'Fallback department not found', {
					method: 'livechat:saveDepartment',
				});
			}
		}

		const departmentDB = await LivechatDepartmentRaw.createOrUpdateDepartment(_id, departmentData);
		if (departmentDB && departmentAgents) {
			await updateDepartmentAgents(departmentDB._id, departmentAgents, departmentDB.enabled);
		}

		// Disable event
		if (department?.enabled && !departmentDB?.enabled) {
			await callbacks.run('livechat.afterDepartmentDisabled', departmentDB);
		}

		return departmentDB;
	},

	async isDepartmentCreationAvailable() {
		return License.hasModule('livechat-enterprise') || (await LivechatDepartmentRaw.countTotal()) === 0;
	},
};
