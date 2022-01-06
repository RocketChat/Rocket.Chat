import { addMigration } from '../../lib/migrations';
import { LivechatDepartmentAgents, LivechatDepartment } from '../../../app/models/server';

const updateEnabledProperty = (departmentIds) => {
	LivechatDepartment.find({ _id: { $in: departmentIds } }).forEach((department) => {
		LivechatDepartmentAgents.update(
			{ departmentId: department._id },
			{
				$set: { departmentEnabled: department.enabled },
			},
			{
				multi: true,
			},
		);
	});
};

addMigration({
	version: 204,
	up() {
		const departmentIds = [
			...new Set(
				LivechatDepartmentAgents.find({}, { fields: { departmentId: 1 } })
					.fetch()
					.map((departmentAgent) => departmentAgent.departmentId),
			),
		];

		updateEnabledProperty(departmentIds);
	},
});
