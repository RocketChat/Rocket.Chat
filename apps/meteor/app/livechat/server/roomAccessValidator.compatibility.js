import { hasPermission, hasRole } from '../../authorization/server';
import { LivechatDepartment, LivechatDepartmentAgents, LivechatInquiry, LivechatRooms } from '../../models/server';
import { RoutingManager } from './lib/RoutingManager';

export const validators = [
	function (room, user) {
		if (!user?._id) {
			return false;
		}
		return hasPermission(user._id, 'view-livechat-rooms');
	},
	function (room, user) {
		if (!user?._id) {
			return false;
		}
		const { _id: userId } = user;
		const { servedBy: { _id: agentId } = {} } = room;
		return userId === agentId || (!room.open && hasPermission(user._id, 'view-livechat-room-closed-by-another-agent'));
	},
	function (room, user, extraData) {
		if (extraData && extraData.rid) {
			room = LivechatRooms.findOneById(extraData.rid);
		}
		return extraData && extraData.visitorToken && room.v && room.v.token === extraData.visitorToken;
	},
	function (room, user) {
		if (!user?._id) {
			return false;
		}
		const { previewRoom } = RoutingManager.getConfig();
		if (!previewRoom) {
			return;
		}

		let departmentIds;
		if (!hasRole(user._id, 'livechat-manager')) {
			const departmentAgents = LivechatDepartmentAgents.findByAgentId(user._id)
				.fetch()
				.map((d) => d.departmentId);
			departmentIds = LivechatDepartment.find({ _id: { $in: departmentAgents }, enabled: true })
				.fetch()
				.map((d) => d._id);
		}

		const filter = {
			rid: room._id,
			$or: [
				{
					$and: [{ defaultAgent: { $exists: true } }, { 'defaultAgent.agentId': user._id }],
				},
				{
					...(departmentIds && departmentIds.length > 0 && { department: { $in: departmentIds } }),
				},
				{
					department: { $exists: false }, // No department == public queue
				},
			],
		};

		const inquiry = LivechatInquiry.findOne(filter, { fields: { status: 1 } });
		return inquiry && inquiry.status === 'queued';
	},
	function (room, user) {
		if (!room.departmentId || room.open || !user?._id) {
			return;
		}
		const agentOfDepartment = LivechatDepartmentAgents.findOneByAgentIdAndDepartmentId(user._id, room.departmentId);
		if (!agentOfDepartment) {
			return;
		}
		return hasPermission(user._id, 'view-livechat-room-closed-same-department');
	},
];
