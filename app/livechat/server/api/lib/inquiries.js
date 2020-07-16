import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatDepartmentAgents, LivechatDepartment, LivechatInquiry } from '../../../../models/server/raw';
import { hasRoleAsync } from '../../../../authorization/server/functions/hasRole';

const agentDepartments = async (userId) => {
	const agentDepartments = (await LivechatDepartmentAgents.findByAgentId(userId).toArray()).map(({ departmentId }) => departmentId);
	return (await LivechatDepartment.find({ _id: { $in: agentDepartments }, enabled: true }).toArray()).map(({ _id }) => _id);
};

const applyDepartmentRestrictions = async (userId, filterDepartment) => {
	if (await hasRoleAsync(userId, 'livechat-manager')) {
		return filterDepartment;
	}

	const allowedDepartments = await agentDepartments(userId);
	if (allowedDepartments && Array.isArray(allowedDepartments) && allowedDepartments.length > 0) {
		if (!filterDepartment) {
			return { $in: allowedDepartments };
		}

		if (!allowedDepartments.includes(filterDepartment)) {
			throw new Error('error-not-authorized');
		}

		return filterDepartment;
	}

	return { $exists: false };
};

export async function findInquiries({ userId, department: filterDepartment, status, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}

	const department = await applyDepartmentRestrictions(userId, filterDepartment);

	const options = {
		limit: count,
		sort: sort || { ts: -1 },
		skip: offset,
	};

	const filter = {
		...status && { status },
		...department && { department },
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
