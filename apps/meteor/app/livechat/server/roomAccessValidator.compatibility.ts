import type { IUser, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatDepartmentAgents, LivechatInquiry, LivechatRooms, LivechatDepartment } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../authorization/server/functions/hasPermission';
import { hasRoleAsync } from '../../authorization/server/functions/hasRole';
import { RoutingManager } from './lib/RoutingManager';

type OmnichannelRoomAccessValidator = (
	room: IOmnichannelRoom,
	user?: Pick<IUser, '_id'>,
	extraData?: Record<string, any>,
) => boolean | Promise<boolean>;

export const validators: OmnichannelRoomAccessValidator[] = [
	async function (_room, user) {
		if (!user?._id) {
			return false;
		}
		return hasPermissionAsync(user._id, 'view-livechat-rooms');
	},
	async function (room, user) {
		if (!user?._id) {
			return false;
		}

		const { _id: userId } = user;
		const { servedBy: { _id: agentId } = {} } = room;
		return userId === agentId || (!room.open && hasPermissionAsync(user._id, 'view-livechat-room-closed-by-another-agent'));
	},
	async function (room, _user, extraData) {
		if (extraData?.rid) {
			const dbRoom = await LivechatRooms.findOneById(extraData.rid);
			if (dbRoom) {
				room = dbRoom;
			}
		}

		return extraData?.visitorToken && room.v && room.v.token === extraData.visitorToken && room.open === true;
	},
	async function (room, user) {
		if (!user?._id) {
			return false;
		}
		if (!RoutingManager.getConfig()?.previewRoom) {
			return;
		}

		let departmentIds;
		if (!(await hasRoleAsync(user._id, 'livechat-manager'))) {
			const departmentAgents = (await LivechatDepartmentAgents.findByAgentId(user._id, { projection: { departmentId: 1 } }).toArray()).map(
				(d) => d.departmentId,
			);
			departmentIds = (await LivechatDepartment.findEnabledInIds(departmentAgents, { projection: { _id: 1 } }).toArray()).map((d) => d._id);
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

		const inquiry = await LivechatInquiry.findOne(filter, { projection: { status: 1 } });
		return inquiry && inquiry.status === 'queued';
	},
	async function (room, user) {
		if (!room.departmentId || room.open || !user?._id) {
			return;
		}
		const agentOfDepartment = await LivechatDepartmentAgents.findOneByAgentIdAndDepartmentId(user._id, room.departmentId, {
			projection: { _id: 1 },
		});
		if (!agentOfDepartment) {
			return;
		}
		return hasPermissionAsync(user._id, 'view-livechat-room-closed-same-department');
	},
	function (_room, user) {
		// Check if user is rocket.cat
		if (!user?._id) {
			return false;
		}

		// This opens the ability for rocketcat to upload files to a livechat room without being included in it :)
		// Worst case, someone manages to log in as rocketcat lol
		return user._id === 'rocket.cat';
	},
];
