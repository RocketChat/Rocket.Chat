import { LivechatRooms } from '../../../../../app/models/server/models/LivechatRooms';
import { queriesLogger } from '../../../livechat-enterprise/server/lib/logger';
import { addQueryRestrictionsToRoomsModel } from '../../../livechat-enterprise/server/lib/query.helper';
import { overwriteClassOnLicense } from '../../../license/server';

const applyRestrictions = (method) =>
	function (originalFn, originalQuery, ...args) {
		const query = addQueryRestrictionsToRoomsModel(originalQuery);
		queriesLogger.debug({ msg: `LivechatRooms.${method}`, query });
		return originalFn.call(this, query, ...args);
	};

overwriteClassOnLicense('livechat-enterprise', LivechatRooms, {
	find: applyRestrictions('find'),
	update: applyRestrictions('update'),
	remove: applyRestrictions('remove'),
	updateDepartmentAncestorsById(originalFn, _id, departmentAncestors) {
		const query = {
			_id,
		};
		const update = departmentAncestors ? { $set: { departmentAncestors } } : { $unset: { departmentAncestors: 1 } };
		return this.update(query, update);
	},
});

LivechatRooms.prototype.setPredictedVisitorAbandonment = function (roomId, willBeAbandonedAt) {
	const query = {
		_id: roomId,
	};
	const update = {
		$set: {
			'omnichannel.predictedVisitorAbandonmentAt': willBeAbandonedAt,
		},
	};

	return this.update(query, update);
};

LivechatRooms.prototype.findAbandonedOpenRooms = function (date) {
	return this.find({
		'omnichannel.predictedVisitorAbandonmentAt': { $lte: date },
		'waitingResponse': { $exists: false },
		'closedAt': { $exists: false },
		'open': true,
	});
};

LivechatRooms.prototype.setOnHold = function (roomId) {
	return this.update({ _id: roomId }, { $set: { onHold: true } });
};

LivechatRooms.prototype.unsetOnHold = function (roomId) {
	return this.update({ _id: roomId }, { $unset: { onHold: 1 } });
};

LivechatRooms.prototype.unsetPredictedVisitorAbandonment = function () {
	return this.update(
		{
			'open': true,
			't': 'l',
			'omnichannel.predictedVisitorAbandonmentAt': { $exists: true },
		},
		{
			$unset: { 'omnichannel.predictedVisitorAbandonmentAt': 1 },
		},
		{
			multi: true,
		},
	);
};

LivechatRooms.prototype.unsetPredictedVisitorAbandonmentByRoomId = function (roomId) {
	return this.update(
		{
			_id: roomId,
		},
		{
			$unset: { 'omnichannel.predictedVisitorAbandonmentAt': 1 },
		},
	);
};

LivechatRooms.prototype.unsetAllOnHoldFieldsByRoomId = function (roomId) {
	return this.update(
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
};

LivechatRooms.prototype.unsetPriorityById = function (priorityId) {
	return this.update(
		{
			open: true,
			t: 'l',
			priorityId,
		},
		{
			$unset: { priorityId: 1 },
		},
		{
			multi: true,
		},
	);
};

LivechatRooms.prototype.findOpenByPriorityId = function (priorityId, options) {
	const query = {
		t: 'l',
		open: true,
		priorityId,
	};

	return this.find(query, options);
};

export default LivechatRooms;
