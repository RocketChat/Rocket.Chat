import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { ILivechatDepartmentModel } from '@rocket.chat/model-typings';
import type { DeleteResult, Document, Filter, FindCursor, FindOptions, UpdateFilter, UpdateResult } from 'mongodb';
import { LivechatUnit } from '@rocket.chat/models';

import { LivechatDepartmentRaw } from '../../../../server/models/raw/LivechatDepartment';

declare module '@rocket.chat/model-typings' {
	interface ILivechatDepartmentModel {
		removeDepartmentFromForwardListById(departmentId: string): Promise<void>;
	}
}

export class LivechatDepartmentEE extends LivechatDepartmentRaw implements ILivechatDepartmentModel {
	async removeDepartmentFromForwardListById(departmentId: string): Promise<void> {
		await this.updateMany({ departmentsAllowedToForward: departmentId }, { $pull: { departmentsAllowedToForward: departmentId } });
	}

	unfilteredFind(query: Filter<ILivechatDepartment>, options: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment> {
		return this.col.find(query, options);
	}

	unfilteredFindOne(query: Filter<ILivechatDepartment>, options: FindOptions<ILivechatDepartment>): Promise<ILivechatDepartment | null> {
		return this.col.findOne(query, options);
	}

	unfilteredUpdate(
		query: Filter<ILivechatDepartment>,
		update: UpdateFilter<ILivechatDepartment>,
		options: FindOptions<ILivechatDepartment>,
	): Promise<UpdateResult> {
		return this.col.updateOne(query, update, options);
	}

	unfilteredRemove(query: Filter<ILivechatDepartment>): Promise<DeleteResult> {
		return this.col.deleteOne(query);
	}

	createOrUpdateDepartment(id: string, data: ILivechatDepartment): Promise<ILivechatDepartment> {
		data.type = 'd';

		return super.createOrUpdateDepartment(id, data);
	}

	removeParentAndAncestorById(id: string): Promise<UpdateResult | Document> {
		return this.updateMany({ parentId: id }, { $unset: { parentId: 1 }, $pull: { ancestors: id } });
	}

	async findEnabledWithAgentsAndBusinessUnit(businessUnit: string, projection: FindOptions<ILivechatDepartment>['projection']) {
		if (!businessUnit) {
			return super.findEnabledWithAgents(projection);
		}
		const unit = await LivechatUnit.findOneById(businessUnit, { projection: { _id: 1 } });
		if (!unit) {
			throw new Meteor.Error('error-unit-not-found', `Error! No Active Business Unit found with id: ${businessUnit}`);
		}

		return super.findActiveByUnitIds([businessUnit], { projection });
	}
}
