import { Meteor } from 'meteor/meteor';

import { LivechatDepartment } from '../../../../../app/models/server/models/LivechatDepartment';
import { LivechatDepartment as LivechatDepartmentModel } from '../../../../../app/models/server';
import { LivechatUnit } from '../index';
import { overwriteClassOnLicense } from '../../../license/server';

const { find, findOne, update, remove } = LivechatDepartment.prototype;

overwriteClassOnLicense('livechat-enterprise', LivechatDepartment, {
	unfilteredFind(originalFn, ...args) {
		return find.apply(this, args);
	},
	unfilteredFindOne(originalFn, ...args) {
		return findOne.apply(this, args);
	},
	unfilteredUpdate(originalFn, ...args) {
		return update.apply(this, args);
	},
	unfilteredRemove(originalFn, ...args) {
		return remove.apply(this, args);
	},
	createOrUpdateDepartment(originalFn, ...args) {
		if (args.length > 2 && !args[1].type) {
			args[1].type = 'd';
		}
		if (args[1] && args[1].departmentsAllowedToForward) {
			args[1].departmentsAllowedToForward = args[1].departmentsAllowedToForward.split(',');
		}

		return originalFn.apply(this, args);
	},
	removeParentAndAncestorById(originalFn, parentId) {
		const query = {
			parentId,
		};

		const update = {
			$unset: { parentId: 1 },
			$pull: { ancestors: parentId },
		};

		return this.update(query, update, { multi: true });
	},
	findEnabledWithAgentsAndBusinessUnit(originalFn, businessUnit, fields = undefined) {
		if (!businessUnit) {
			return LivechatDepartmentModel.findEnabledWithAgents(fields);
		}
		const unit = LivechatUnit.findOneById(businessUnit, { fields: { _id: 1 } });
		if (!unit) {
			throw new Meteor.Error('error-unit-not-found', `Error! No Active Business Unit found with id: ${businessUnit}`);
		}

		return LivechatDepartmentModel.findActiveByUnitIds([businessUnit], { fields });
	},
});

LivechatDepartment.prototype.removeDepartmentFromForwardListById = function (_id) {
	return this.update({ departmentsAllowedToForward: _id }, { $pull: { departmentsAllowedToForward: _id } }, { multi: true });
};

export default LivechatDepartment;
