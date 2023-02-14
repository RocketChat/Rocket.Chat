import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import type { ILivechatRoomsModel } from '@rocket.chat/model-typings';
import type { FindCursor, UpdateResult } from 'mongodb';

import { LivechatRoomsRaw } from '../../../../server/models/raw/LivechatRooms';
import { queriesLogger } from '../../../app/livechat-enterprise/server/lib/logger';
import { addQueryRestrictionsToRoomsModel } from '../../../app/livechat-enterprise/server/lib/query.helper';

declare module '@rocket.chat/model-typings' {
	export interface ILivechatRoomsModel {
		associateRoomsWithDepartmentToUnit: (departments: string[], unit: string) => Promise<void>;
		removeUnitAssociationFromRooms: (unit: string) => Promise<void>;
		updateDepartmentAncestorsById: (rid: string, ancestors: string[]) => Promise<UpdateResult>;
		unsetPredictedVisitorAbandonmentByRoomId(rid: string): Promise<UpdateResult>;
		findAbandonedOpenRooms(date: Date): FindCursor<IOmnichannelRoom>;
		setPredictedVisitorAbandonmentByRoomId(roomId: string, date: Date): Promise<UpdateResult>;
		unsetAllPredictedVisitorAbandonment(): Promise<void>;
		setOnHoldByRoomId(roomId: string): Promise<UpdateResult>;
		unsetOnHoldByRoomId(roomId: string): Promise<UpdateResult>;
		unsetOnHoldAndPredictedVisitorAbandonmentByRoomId(roomId: string): Promise<UpdateResult>;
		unsetPriorityByIdFromAllOpenRooms(priorityId: string): Promise<void>;
		findOpenRoomsByPriorityId(priorityId: string): FindCursor<IOmnichannelRoom>;
	}
}

export class LivechatRoomsRawEE extends LivechatRoomsRaw implements ILivechatRoomsModel {
	async unsetAllPredictedVisitorAbandonment(): Promise<void> {
		return this.updateMany(
			{
				'open': true,
				't': 'l',
				'omnichannel.predictedVisitorAbandonmentAt': { $exists: true },
			},
			{
				$unset: { 'omnichannel.predictedVisitorAbandonmentAt': 1 },
			},
		).then();
	}

	setOnHoldByRoomId(roomId: string): Promise<UpdateResult> {
		return this.updateOne({ _id: roomId }, { $set: { onHold: true } });
	}

	unsetOnHoldByRoomId(roomId: string): Promise<UpdateResult> {
		return this.updateOne({ _id: roomId }, { $unset: { onHold: 1 } });
	}

	unsetOnHoldAndPredictedVisitorAbandonmentByRoomId(roomId: string): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: roomId,
			},
			{
				$unset: {
					'omnichannel.predictedVisitorAbandonmentAt': 1,
					'onHold': 1,
				},
			},
		);
	}

	async unsetPriorityByIdFromAllOpenRooms(priorityId: string): Promise<void> {
		return this.updateMany(
			{
				open: true,
				t: 'l',
				priorityId,
			},
			{
				$unset: { priorityId: 1 },
			},
		).then();
	}

	findOpenRoomsByPriorityId(priorityId: string): FindCursor<IOmnichannelRoom> {
		const query = {
			t: 'l',
			open: true,
			priorityId,
		};

		return this.find(query);
	}

	setPredictedVisitorAbandonmentByRoomId(rid: string, willBeAbandonedAt: Date): Promise<UpdateResult> {
		const query = {
			_id: rid,
		};
		const update = {
			$set: {
				'omnichannel.predictedVisitorAbandonmentAt': willBeAbandonedAt,
			},
		};

		return this.updateOne(query, update);
	}

	findAbandonedOpenRooms(date: Date): FindCursor<IOmnichannelRoom> {
		return this.find({
			'omnichannel.predictedVisitorAbandonmentAt': { $lte: date },
			'waitingResponse': { $exists: false },
			'closedAt': { $exists: false },
			'open': true,
		});
	}

	async unsetPredictedVisitorAbandonmentByRoomId(roomId: string): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: roomId,
			},
			{
				$unset: { 'omnichannel.predictedVisitorAbandonmentAt': 1 },
			},
		);
	}

	async associateRoomsWithDepartmentToUnit(departments: string[], unitId: string): Promise<void> {
		const query = {
			$and: [
				{
					departmentId: { $in: departments },
				},
				{
					$or: [
						{
							departmentAncestors: { $exists: false },
						},
						{
							$and: [
								{
									departmentAncestors: { $exists: true },
								},
								{
									departmentAncestors: { $ne: unitId },
								},
							],
						},
					],
				},
			],
		};
		const update = { $set: { departmentAncestors: [unitId] } };
		queriesLogger.debug({ msg: `LivechatRoomsRawEE.associateRoomsWithDepartmentToUnit - association step`, query, update });
		const associationResult = await this.updateMany(query, update);
		queriesLogger.debug({ msg: `LivechatRoomsRawEE.associateRoomsWithDepartmentToUnit - association step`, result: associationResult });

		const queryToDisassociateOldRoomsConnectedToUnit = {
			departmentAncestors: unitId,
			departmentId: { $nin: departments },
		};
		const updateToDisassociateRooms = { $unset: { departmentAncestors: 1 } };
		queriesLogger.debug({
			msg: `LivechatRoomsRawEE.associateRoomsWithDepartmentToUnit - disassociation step`,
			query: queryToDisassociateOldRoomsConnectedToUnit,
			update: updateToDisassociateRooms,
		});
		const disassociationResult = await this.updateMany(queryToDisassociateOldRoomsConnectedToUnit, updateToDisassociateRooms);
		queriesLogger.debug({
			msg: `LivechatRoomsRawEE.associateRoomsWithDepartmentToUnit - disassociation step`,
			result: disassociationResult,
		});
	}

	async removeUnitAssociationFromRooms(unitId: string): Promise<void> {
		const query = {
			departmentAncestors: unitId,
		};
		const update = { $unset: { departmentAncestors: 1 } };
		queriesLogger.debug({ msg: `LivechatRoomsRawEE.removeUnitAssociationFromRooms`, query, update });
		const result = await this.updateMany(query, update);
		queriesLogger.debug({ msg: `LivechatRoomsRawEE.removeUnitAssociationFromRooms`, result });
	}

	async updateDepartmentAncestorsById(rid: string, departmentAncestors: string[]) {
		const query = {
			_id: rid,
		};
		const update = departmentAncestors ? { $set: { departmentAncestors } } : { $unset: { departmentAncestors: 1 } };
		return this.updateOne(query, update);
	}

	find(...args: Parameters<LivechatRoomsRaw['find']>) {
		const [query, ...restArgs] = args;
		const restrictedQuery = addQueryRestrictionsToRoomsModel(query);
		queriesLogger.debug({ msg: 'LivechatRoomsRawEE.find', query: restrictedQuery });
		return super.find(restrictedQuery, ...restArgs);
	}

	findPaginated(...args: Parameters<LivechatRoomsRaw['findPaginated']>) {
		const [query, ...restArgs] = args;
		const restrictedQuery = addQueryRestrictionsToRoomsModel(query);
		queriesLogger.debug({ msg: 'LivechatRoomsRawEE.findPaginated', query: restrictedQuery });
		return super.findPaginated(restrictedQuery, ...restArgs);
	}

	/** @deprecated Use updateOne or updateMany instead */
	update(...args: Parameters<LivechatRoomsRaw['update']>) {
		const [query, ...restArgs] = args;
		const restrictedQuery = addQueryRestrictionsToRoomsModel(query);
		queriesLogger.debug({ msg: 'LivechatRoomsRawEE.update', query: restrictedQuery });
		return super.update(restrictedQuery, ...restArgs);
	}

	updateOne(...args: Parameters<LivechatRoomsRaw['updateOne']>) {
		const [query, ...restArgs] = args;
		const restrictedQuery = addQueryRestrictionsToRoomsModel(query);
		queriesLogger.debug({ msg: 'LivechatRoomsRawEE.updateOne', query: restrictedQuery });
		return super.updateOne(restrictedQuery, ...restArgs);
	}

	updateMany(...args: Parameters<LivechatRoomsRaw['updateMany']>) {
		const [query, ...restArgs] = args;
		const restrictedQuery = addQueryRestrictionsToRoomsModel(query);
		queriesLogger.debug({ msg: 'LivechatRoomsRawEE.updateMany', query: restrictedQuery });
		return super.updateMany(restrictedQuery, ...restArgs);
	}
}
