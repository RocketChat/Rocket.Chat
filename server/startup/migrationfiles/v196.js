import { Migrations } from '../migrations';
import { LivechatDepartmentAgents } from '../../models';

const removeOrphanDepartmentAgents = async () => {
	const orphanAgentIds = (await LivechatDepartmentAgents.model.rawCollection().aggregate([
		{
			$lookup: {
				from: 'rocketchat_livechat_department',
				localField: 'departmentId',
				foreignField: '_id',
				as: 'departments',
			},
		},
		{
			$unwind: {
				path: '$departments',
				preserveNullAndEmptyArrays: true,
			},
		},
		{ $match: { departments: { $exists: false } } },
	]).toArray()).map((dept) => dept._id);
	LivechatDepartmentAgents.remove({ _id: { $in: orphanAgentIds } });
};

Migrations.add({
	version: 196,
	up() {
		Promise.await(removeOrphanDepartmentAgents());
	},
});
