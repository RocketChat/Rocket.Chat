import type { IUser, ILivechatDepartment, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatDepartmentAgents, LivechatInquiry, LivechatRooms } from '@rocket.chat/models';

import { hasRoleAsync } from '../../authorization/server/functions/hasRole';
import { hasPermissionAsync } from '../../authorization/server/functions/hasPermission';
import { LivechatDepartment } from '../../models/server';
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

		return extraData?.visitorToken && room.v && room.v.token === extraData.visitorToken;
	},
	async function (room, user) {
		if (!user?._id) {
			return false;
		}
		const { previewRoom } = RoutingManager.getConfig();
		if (!previewRoom) {
			return;
		}

		let departmentIds;
		if (!(await hasRoleAsync(user._id, 'livechat-manager'))) {
			const departmentAgents = (await LivechatDepartmentAgents.findByAgentId(user._id).toArray()).map((d) => d.departmentId);
			departmentIds = LivechatDepartment.find({ _id: { $in: departmentAgents }, enabled: true })
				.fetch()
				.map((d: ILivechatDepartment) => d._id);
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
		const agentOfDepartment = await LivechatDepartmentAgents.findOneByAgentIdAndDepartmentId(user._id, room.departmentId);
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
