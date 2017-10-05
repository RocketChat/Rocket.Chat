RocketChat.API.v1.addRoute('livechat/department', { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return RocketChat.API.v1.unauthorized();
		}

		return RocketChat.API.v1.success({
			departments: RocketChat.models.LivechatDepartment.find().fetch()
		});
	},
	post() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return RocketChat.API.v1.unauthorized();
		}

		try {
			check(this.bodyParams, {
				department: Object,
				agents: Array
			});

			const department = RocketChat.Livechat.saveDepartment(null, this.bodyParams.department, this.bodyParams.agents);

			if (department) {
				return RocketChat.API.v1.success({
					department,
					agents: RocketChat.models.LivechatDepartmentAgents.find({ departmentId: department._id }).fetch()
				});
			}

			RocketChat.API.v1.failure();
		} catch (e) {
			return RocketChat.API.v1.failure(e);
		}
	}
});

RocketChat.API.v1.addRoute('livechat/department/:_id', { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return RocketChat.API.v1.unauthorized();
		}

		try {
			check(this.urlParams, {
				_id: String
			});

			return RocketChat.API.v1.success({
				department: RocketChat.models.LivechatDepartment.findOneById(this.urlParams._id),
				agents: RocketChat.models.LivechatDepartmentAgents.find({ departmentId: this.urlParams._id }).fetch()
			});
		} catch (e) {
			return RocketChat.API.v1.failure(e.error);
		}
	},
	put() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return RocketChat.API.v1.unauthorized();
		}

		try {
			check(this.urlParams, {
				_id: String
			});

			check(this.bodyParams, {
				department: Object,
				agents: Array
			});

			if (RocketChat.Livechat.saveDepartment(this.urlParams._id, this.bodyParams.department, this.bodyParams.agents)) {
				return RocketChat.API.v1.success({
					department: RocketChat.models.LivechatDepartment.findOneById(this.urlParams._id),
					agents: RocketChat.models.LivechatDepartmentAgents.find({ departmentId: this.urlParams._id }).fetch()
				});
			}

			return RocketChat.API.v1.failure();
		} catch (e) {
			return RocketChat.API.v1.failure(e.error);
		}
	},
	delete() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return RocketChat.API.v1.unauthorized();
		}

		try {
			check(this.urlParams, {
				_id: String
			});

			if (RocketChat.Livechat.removeDepartment(this.urlParams._id)) {
				return RocketChat.API.v1.success();
			}

			return RocketChat.API.v1.failure();
		} catch (e) {
			return RocketChat.API.v1.failure(e.error);
		}
	}
});
