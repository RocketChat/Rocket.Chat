import { check } from 'meteor/check';

import { API } from '../../../../api';
import { findAgentDepartments } from '../../../server/api/lib/agents';

API.v1.addRoute('livechat/agents/:agentId/departments', { authRequired: true }, {
	get() {
		check(this.urlParams, {
			agentId: String,
		});

		const departments = Promise.await(findAgentDepartments({
			userId: this.userId,
			agentId: this.urlParams.agentId,
		}));

		return API.v1.success(departments);
	},
});
