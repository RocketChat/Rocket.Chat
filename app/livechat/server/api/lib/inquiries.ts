import { ILivechatInquiryRecord } from '../../../../../definition/IInquiry';
import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatDepartmentAgents, LivechatDepartment, LivechatInquiry } from '../../../../models/server/raw';
import { hasAnyRoleAsync } from '../../../../authorization/server/functions/hasRole';

const agentDepartments = async (userId: string): Promise<string[]> => {
	const agentDepartments = (await LivechatDepartmentAgents.findByAgentId(userId).toArray()).map(({ departmentId }) => departmentId);
	return (await LivechatDepartment.find({ _id: { $in: agentDepartments }, enabled: true }).toArray()).map(({ _id }) => _id);
};

const applyDepartmentRestrictions = async (
	userId: string,
	filterDepartment: string,
): Promise<string | { $in: string[] } | { $exists: boolean }> => {
	if (await hasAnyRoleAsync(userId, ['livechat-manager'])) {
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

export async function findInquiries(
	userId: string,
	filterDepartment: string,
	status: string,
	{ offset, count, sort }: { offset: number; count: number; sort: any }, // pagination
): Promise<ILivechatInquiryRecord | { inquiries: ILivechatInquiryRecord[]; count: number; offset: number; total: number }> {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	const department = await applyDepartmentRestrictions(userId, filterDepartment);

	const options = {
		limit: count,
		sort: sort || { ts: -1 },
		skip: offset,
	};

	const filter = {
		...(status && { status }),
		$or: [
			{
				$and: [{ defaultAgent: { $exists: true } }, { 'defaultAgent.agentId': userId }],
			},
			{ ...(department && { department }) },
		],
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

export async function findOneInquiryByRoomId({ userId, roomId }: { userId: string; roomId: string }): Promise<{ inquiry: string | null }> {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	return {
		inquiry: await LivechatInquiry.findOneByRoomId(roomId, {}),
	};
}
