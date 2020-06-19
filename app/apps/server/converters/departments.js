import LivechatDepartment from '../../../models/server/models/LivechatDepartment';
import { transformMappedData } from '../../lib/misc/transformMappedData';

export class AppDepartmentsConverter {
	constructor(orch) {
		this.orch = orch;
	}

	convertById(id) {
		const department = LivechatDepartment.findOneById(id);

		return this.convertDepartment(department);
	}

	convertDepartment(department) {
		if (!department) {
			return undefined;
		}

		const map = {
			id: '_id',
			name: 'name',
			email: 'email',
			updatedAt: '_updatedAt',
			enabled: 'enabled',
			numberOfAgents: 'numAgents',
			showOnOfflineForm: 'showOnOfflineForm',
			showOnRegistration: 'showOnRegistration',
		};

		return transformMappedData(department, map);
	}

	convertAppDepartment(department) {
		if (!department) {
			return undefined;
		}

		const newDepartment = {
			_id: department.id,
			name: department.name,
			email: department.email,
			_updatedAt: department.updatedAt,
			enabled: department.enabled,
			numAgents: department.numberOfAgents,
			showOnOfflineForm: department.showOnOfflineForm,
			showOnRegistration: department.showOnRegistration,
		};

		return Object.assign(newDepartment, department._unmappedProperties_);
	}
}
