import type { ILivechatDepartmentModel } from '@rocket.chat/model-typings';
import { LivechatUnit, registerModel } from '@rocket.chat/models';
import type { FindCursor, FindOptions, UpdateResult, Document } from 'mongodb';
import type { ILivechatDepartmentRecord } from '@rocket.chat/core-typings';

import { LivechatDepartmentRaw } from '../../../../server/models/raw/LivechatDepartment';
import { overwriteClassOnLicense } from '../../../app/license/server';
import { db } from '../../../../server/database/utils';

// Let's extend the typings :)
declare module '@rocket.chat/model-typings' {
	interface ILivechatDepartmentModel {
		removeParentAndAncestorById?(id: string): Promise<UpdateResult | Document>;
		findEnabledWithAgentsAndBusinessUnit?(
			businessUnit: string,
			projection?: FindOptions<ILivechatDepartmentModel>['projection'],
		): Promise<FindCursor<ILivechatDepartmentRecord>>;
		removeDepartmentFromForwardListById?(_id: string): Promise<UpdateResult>;
	}
}

overwriteClassOnLicense('livechat-enterprise', LivechatDepartmentRaw, {
	createOrUpdateDepartment(originalFn: Function, ...args: Parameters<ILivechatDepartmentModel['createOrUpdateDepartment']>) {
		if (args.length > 2 && !args[1].type) {
			args[1].type = 'd';
		}
		if (args[1]?.departmentsAllowedToForward) {
			args[1].departmentsAllowedToForward = args[1].departmentsAllowedToForward.split(',');
		}

		return originalFn.apply(this, args);
	},
	removeParentAndAncestorById(_: Function, parentId: string) {
		const query = {
			parentId,
		};

		const update = {
			$unset: { parentId: 1 },
			$pull: { ancestors: parentId },
		};

		return this.updateMany(query, update);
	},
	async findEnabledWithAgentsAndBusinessUnit(
		_: Function,
		businessUnit: string,
		projection?: FindOptions<ILivechatDepartmentModel>['projection'],
	): Promise<FindCursor<ILivechatDepartmentRecord>> {
		if (!businessUnit) {
			return this.findEnabledWithAgents(projection);
		}
		const unit = await LivechatUnit.findOneById(businessUnit, { projection: { _id: 1 } });
		if (!unit) {
			throw new Meteor.Error('error-unit-not-found', `Error! No Active Business Unit found with id: ${businessUnit}`);
		}

		return this.findActiveByUnitIds([businessUnit], { projection });
	},

	removeDepartmentFromForwardListById(_: Function, _id: string): Promise<UpdateResult> {
		return this.updateMany({ departmentsAllowedToForward: _id }, { $pull: { departmentsAllowedToForward: _id } });
	},
});

registerModel('ILivechatDepartmentModel', new LivechatDepartmentRaw(db));
