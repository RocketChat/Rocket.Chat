import { check } from 'meteor/check';
import { API } from '/app/api';
import { hasPermission } from '/app/authorization';
import { LivechatDepartment, LivechatDepartmentAgents } from '/app/models';
import { Livechat } from '../../../server/lib/Livechat';

API.v1.addRoute('livechat/department', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-livechat-manager')) {
			return API.v1.unauthorized();
		}

		return API.v1.success({
			departments: LivechatDepartment.find().fetch(),
		});
	},
	post() {
		if (!hasPermission(this.userId, 'view-livechat-manager')) {
			return API.v1.unauthorized();
		}

		try {
			check(this.bodyParams, {
				department: Object,
				agents: Array,
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
		if (!hasPermission(this.userId, 'view-livechat-manager')) {
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
		if (!hasPermission(this.userId, 'view-livechat-manager')) {
			return API.v1.unauthorized();
		}

		try {
			check(this.urlParams, {
				_id: String,
			});

			check(this.bodyParams, {
				department: Object,
				agents: Array,
			});

			if (Livechat.saveDepartment(this.urlParams._id, this.bodyParams.department, this.bodyParams.agents)) {
				return API.v1.success({
					department: LivechatDepartment.findOneById(this.urlParams._id),
					agents: LivechatDepartmentAgents.find({ departmentId: this.urlParams._id }).fetch(),
				});
			}

			return API.v1.failure();
		} catch (e) {
			return API.v1.failure(e.error);
		}
	},
	delete() {
		if (!hasPermission(this.userId, 'view-livechat-manager')) {
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
			return API.v1.failure(e.error);
		}
	},
});
