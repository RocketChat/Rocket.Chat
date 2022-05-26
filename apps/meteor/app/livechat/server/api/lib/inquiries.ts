import { ILivechatInquiryRecord, LivechatInquiryStatus } from '@rocket.chat/core-typings';
import { PaginatedResult } from '@rocket.chat/rest-typings';
import { Condition, SortOptionObject } from 'mongodb';

import { LivechatDepartmentAgents, LivechatDepartment, LivechatInquiry } from '../../../../models/server/raw';

type Pagination<T> = { pagination: { offset: number; count: number; sort: SortOptionObject<T> } };
type FindInquiriesParams = {
	userId: string;
	department?: string;
	status: LivechatInquiryStatus;
} & Pagination<ILivechatInquiryRecord>;

const agentDepartments = async (userId: string): Promise<string[]> => {
	const agentDepartments = (await LivechatDepartmentAgents.findByAgentId(userId).toArray()).map(({ departmentId }) => departmentId);
	return (await LivechatDepartment.find({ _id: { $in: agentDepartments }, enabled: true }).toArray()).map(({ _id }) => _id);
};

const applyDepartmentRestrictions = async (
	userId: string,
	filterDepartment?: string,
): Promise<Condition<ILivechatInquiryRecord['department']>> => {
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
}: FindInquiriesParams): Promise<PaginatedResult<{ inquiries: ILivechatInquiryRecord[] }>> {
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
			// Add _always_ the "public queue" to returned list of inquiries, even if agent already has departments
			{ department: { $exists: false } },
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

export async function findOneInquiryByRoomId({ roomId }: { roomId: string }): Promise<{ inquiry: ILivechatInquiryRecord | null }> {
	return {
		inquiry: await LivechatInquiry.findOneByRoomId(roomId, {}),
	};
}
