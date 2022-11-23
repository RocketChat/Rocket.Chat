import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import { LivechatDepartmentAgents, LivechatDepartment, LivechatInquiry } from '@rocket.chat/models';

const agentDepartments = async (userId: string) => {
	const agentDepartments = (await LivechatDepartmentAgents.findByAgentId(userId).toArray()).map(({ departmentId }) => departmentId);
	return (await LivechatDepartment.find({ _id: { $in: agentDepartments }, enabled: true }).toArray()).map(({ _id }) => _id);
};

const applyDepartmentRestrictions = async (userId: string, filterDepartment?: string) => {
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
	userId: string;
	department?: string;
	status?: string;
	pagination: {
		offset: number;
		count: number;
		sort: Record<string, 1 | -1>;
	};
}) {
	const department = await applyDepartmentRestrictions(userId, filterDepartment);
	const options = [
		{
			$limit: count,
		},
		{
			$skip: offset,
		},
	];

	const filter = [
		{
			$match: {
				$and: [
					{ ...(status && { status }) },
					{
						$or: [
							{
								$and: [{ defaultAgent: { $exists: true } }, { 'defaultAgent.agentId': userId }],
							},
							{ ...(department && { department }) },
							// Add _always_ the "public queue" to returned list of inquiries, even if agent already has departments
							{ department: { $exists: false } },
						],
					},
				],
			},
		},
		...(await LivechatInquiry.getSortingQuery(sort)),
		...options,
	];
	const cursor = LivechatInquiry.col.aggregate<ILivechatInquiryRecord>(filter);

	const [inquiries, total] = await Promise.all([cursor.toArray(), LivechatInquiry.col.countDocuments()]);

	return {
		inquiries,
		count: inquiries.length,
		offset,
		total,
	};
}

export async function findOneInquiryByRoomId({ roomId }: { roomId: string }) {
	return {
		inquiry: await LivechatInquiry.findOneByRoomId(roomId, {}),
	};
}
