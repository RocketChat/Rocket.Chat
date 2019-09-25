import { Match, check } from 'meteor/check';

import { API } from '../../../../api';
import { hasPermission } from '../../../../authorization';
import { LivechatDepartment, LivechatDepartmentAgents } from '../../../../models';
import { Livechat } from '../../../server/lib/Livechat';

API.v1.addRoute('livechat/department', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-livechat-departments')) {
			return API.v1.unauthorized();
		}

		return API.v1.success({
			departments: LivechatDepartment.find().fetch(),
		});
	},
	post() {
		if (!hasPermission(this.userId, 'manage-livechat-departments')) {
			return API.v1.unauthorized();
		}

		try {
			check(this.bodyParams, {
				department: Object,
				agents: Match.Maybe(Array),
			});

			const department = Livechat.saveDepartment(null, this.bodyParams.department, this.bodyParams.agents);

			if (department) {
				return API.v1.success({
					department,
					agents: LivechatDepartmentAgents.find({ departmentId: department._id }).fetch(),
				});
			}

			API.v1.failure();
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('livechat/department/:_id', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-livechat-departments')) {
			return API.v1.unauthorized();
		}

		try {
			check(this.urlParams, {
				_id: String,
			});

			return API.v1.success({
				department: LivechatDepartment.findOneById(this.urlParams._id),
				agents: LivechatDepartmentAgents.find({ departmentId: this.urlParams._id }).fetch(),
			});
		} catch (e) {
			return API.v1.failure(e.error);
		}
	},
	put() {
		const permissionToSave = hasPermission(this.userId, 'manage-livechat-departments');
		const permissionToAddAgents = hasPermission(this.userId, 'add-livechat-department-agents');

		if (!permissionToSave && !permissionToAddAgents) {
			return API.v1.unauthorized();
		}

		try {
			check(this.urlParams, {
				_id: String,
			});

			check(this.bodyParams, {
				department: Object,
				agents: Match.Maybe(Array),

			});

			const { _id } = this.urlParams;
			const { department, agents } = this.bodyParams;

			let success;
			if (permissionToSave) {
				success = Livechat.saveDepartment(_id, department, agents);
			}

			if (success && agents && permissionToAddAgents) {
				success = Livechat.saveDepartmentAgents(_id, agents);
			}

			if (success) {
				return API.v1.success({
					department: LivechatDepartment.findOneById(_id),
					agents: LivechatDepartmentAgents.find({ departmentId: _id }).fetch(),
				});
			}

			return API.v1.failure();
		} catch (e) {
			return API.v1.failure(e);
		}
	},
	delete() {
		if (!hasPermission(this.userId, 'manage-livechat-departments')) {
			return API.v1.unauthorized();
		}

		try {
			check(this.urlParams, {
				_id: String,
			});

			if (Livechat.removeDepartment(this.urlParams._id)) {
				return API.v1.success();
			}

			return API.v1.failure();
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
