import { Migrations } from '../../../app/migrations';
import { LivechatDepartmentAgents, LivechatDepartment } from '../../../app/models/server';

const updateEnabledProperty = (departmentIds) => {
	LivechatDepartment
		.find({ _id: { $in: departmentIds } })
		.forEach((department) => {
			LivechatDepartmentAgents.update({ departmentId: department._id },
				{
					$set: { departmentEnabled: department.enabled },
				},
				{
					multi: true,
				});
		});
};

const removeOrphanedDepartmentAgents = (departmentIds) => {
	departmentIds.forEach((departmentId) => {
		if (!LivechatDepartment.findOneById(departmentId)) {
			LivechatDepartmentAgents.removeByDepartmentId(departmentId);
		}
	});
};

Migrations.add({
	version: 189,
	up() {
		const departmentIds = [...new Set(LivechatDepartmentAgents
			.find({}, { fields: { departmentId: 1 } })
			.fetch()
			.map((departmentAgent) => departmentAgent.departmentId))];

		updateEnabledProperty(departmentIds);
		removeOrphanedDepartmentAgents(departmentIds);
	},
});
