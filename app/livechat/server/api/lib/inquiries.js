import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatDepartmentAgents, LivechatDepartment, LivechatInquiry } from '../../../../models/server/raw';
import { hasRoleAsync } from '../../../../authorization/server/functions/hasRole';

export async function findInquiries({ userId, department, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}

	const options = {
		limit: count,
		sort: sort || { ts: -1 },
		skip: offset,
	};

	if (department) {
		const cursor = LivechatInquiry.find({ status: 'queued', department }, options);

		const total = await cursor.count();

		const inquiries = await cursor.toArray();

		return {
			inquiries,
			count: inquiries.length,
			offset,
			total,
		};
	}

	let departmentIds;
	if (!await hasRoleAsync(this.userId, 'livechat-manager')) {
		const departmentAgents = (await LivechatDepartmentAgents.findByAgentId(userId).toArray()).map((d) => d.departmentId);
		departmentIds = (await LivechatDepartment.find({ _id: { $in: departmentAgents }, enabled: true }).toArray()).map((d) => d._id);
	}

	const filter = {
		status: 'queued',
		...departmentIds && departmentIds.length > 0 && { department: { $in: departmentIds } },
	};

	const cursor = LivechatInquiry.find(filter, options);

	const total = await cursor.count();

	const inquiries = await cursor.toArray();

	return {
		inquiries,
		count: inquiries.length,
		offset,
		total,
	};
}

export async function findOneInquiryByRoomId({ userId, roomId }) {
	if (!await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}

	return {
		inquiry: await LivechatInquiry.findOneByRoomId(roomId),
	};
}
