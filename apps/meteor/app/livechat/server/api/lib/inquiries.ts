import { LivechatInquiryStatus } from '@rocket.chat/core-typings';
import type { ILivechatInquiryRecord, IRoom, IUser } from '@rocket.chat/core-typings';
import { LivechatDepartmentAgents, LivechatDepartment, LivechatInquiry } from '@rocket.chat/models';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import type { Filter } from 'mongodb';

import { getOmniChatSortQuery } from '../../../lib/inquiries';
import { getInquirySortMechanismSetting } from '../../lib/settings';

const agentDepartments = async (userId: IUser['_id']): Promise<string[]> => {
	const agentDepartments = (await LivechatDepartmentAgents.findByAgentId(userId, { projection: { departmentId: 1 } }).toArray()).map(
		({ departmentId }) => departmentId,
	);
	return (await LivechatDepartment.findEnabledInIds(agentDepartments, { projection: { _id: 1 } }).toArray()).map(({ _id }) => _id);
};

const applyDepartmentRestrictions = async (
	userId: IUser['_id'],
	filterDepartment?: string,
): Promise<{ $in: string[] } | { $exists: false } | string> => {
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

export async function findInquiries({
	userId,
	department: filterDepartment,
	status,
	pagination: { offset, count, sort },
}: {
	userId: IUser['_id'];
	department?: string;
	status?: LivechatInquiryStatus;
	pagination: { offset: number; count: number; sort: Record<string, number> };
}): Promise<PaginatedResult<{ inquiries: Array<ILivechatInquiryRecord> }>> {
	const department = await applyDepartmentRestrictions(userId, filterDepartment);
	const defaultSort = getOmniChatSortQuery(getInquirySortMechanismSetting());
	const options = {
		limit: count,
		skip: offset,
		sort: { ...sort, ...defaultSort },
	};

	const filter: Filter<ILivechatInquiryRecord> = {
		// V in Enum only works for numeric enums
		...(status && Object.values(LivechatInquiryStatus).includes(status) && { status }),
		$or: [
			// Cases where this user is the default agent
			{
				'defaultAgent': { $exists: true },
				'defaultAgent.agentId': userId,
			},
			// Cases with no default agent assigned yet, AND either:
			// - belongs to one of user's departments, or
			// - has no department (public queue)
			{
				defaultAgent: { $exists: false },
				$or: [...(department ? [{ department }] : []), { department: { $exists: false } }],
			},
		],
	};

	const { cursor, totalCount } = LivechatInquiry.findPaginated(filter, options);

	const [inquiries, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		inquiries,
		count: inquiries.length,
		offset,
		total,
	};
}

export async function findOneInquiryByRoomId({ roomId }: { roomId: IRoom['_id'] }): Promise<{ inquiry: ILivechatInquiryRecord | null }> {
	return {
		inquiry: await LivechatInquiry.findOneByRoomId(roomId, {}),
	};
}
