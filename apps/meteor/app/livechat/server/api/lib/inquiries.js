import { LivechatDepartmentAgents, LivechatDepartment, LivechatInquiry } from '@rocket.chat/models';

const agentDepartments = async (userId) => {
	const agentDepartments = (await LivechatDepartmentAgents.findByAgentId(userId).toArray()).map(({ departmentId }) => departmentId);
	return (await LivechatDepartment.find({ _id: { $in: agentDepartments }, enabled: true }).toArray()).map(({ _id }) => _id);
};

const applyDepartmentRestrictions = async (userId, filterDepartment) => {
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
	const department = await applyDepartmentRestrictions(userId, filterDepartment);
	const options = {
		limit: count,
		skip: offset,
	};

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
		...(await LivechatInquiry.getSortingQuery()),
	];
	const cursor = LivechatInquiry.col.aggregate(filter, options);

	const [inquiries, total] = await Promise.all([cursor.toArray(), LivechatInquiry.col.countDocuments(filter[0].$match)]);

	return {
		inquiries,
		count: inquiries.length,
		offset,
		total,
	};
}

export async function findOneInquiryByRoomId({ roomId }) {
	return {
		inquiry: await LivechatInquiry.findOneByRoomId(roomId),
	};
}
