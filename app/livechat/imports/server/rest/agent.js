import { check } from 'meteor/check';

import { API } from '../../../../api';
import { findAgentDepartments } from '../../../server/api/lib/agents';

API.v1.addRoute('livechat/agent/:agentId/departments', { authRequired: true }, {
	get() {
		check(this.urlParams, {
			agentId: String,
		});
		const { offset, count } = this.getPaginationItems();
		const { sort } = this.parseJsonQuery();

		const departments = Promise.await(findAgentDepartments({
			userId: this.userId,
			agentId: this.urlParams.agentId,
			pagination: {
				offset,
				count,
				sort,
			},
		}));

		return API.v1.success(departments);
	},
});
