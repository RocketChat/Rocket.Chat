import { Match, check } from 'meteor/check';

import { API } from '../../api';
import { Users } from '../../../../models/server/raw/index';
import { hasPermission } from '../../../../authorization/server/index';
import { LivechatVoip } from '../../../../../server/sdk';

API.v1.addRoute('omnichannel.agent.extension', { authRequired: true }, {
	// Get the extensions associated with the agent passed as request params.
	get() {
		if (!hasPermission(this.userId, 'view-agent-extension-association')) {
			return API.v1.unauthorized();
		}
		check(this.requestParams(), Match.ObjectIncluding({
			username: String,
		}));
		const user = Promise.await(Users.findOneByAgentUsername(this.requestParams().username, {
			projection: { _id: 1 },
		}));
		if (!user) {
			return API.v1.notFound('User not found');
		}
		const extension = Promise.await(Users.getVoipExtensionByUserId(user._id, {
			projection: {
				_id: 1,
				username: 1,
				extension: 1,
			},
		}).toArray());
		if (!extension) {
			return API.v1.notFound('Extension not found');
		}
		return API.v1.success(...extension);
	},

	// Create agent-extension association.
	post() {
		if (!hasPermission(this.userId, 'manage-agent-extension-association')) {
			return API.v1.unauthorized();
		}
		check(this.bodyParams, {
			username: String,
			extension: String,
		});
		const user = Promise.await(Users.findOneByAgentUsername(this.bodyParams.username, {
			projection: {
				_id: 1,
				username: 1,
			},
		}));
		if (!user) {
			return API.v1.notFound();
		}
		Users.setExtension(user._id, this.bodyParams.extension);
		return API.v1.success();
	},
	delete() {
		if (!hasPermission(this.userId, 'manage-agent-extension-association')) {
			return API.v1.unauthorized();
		}
		check(this.requestParams(), Match.ObjectIncluding({
			username: String,
		}));
		const user = Promise.await(Users.findOneByAgentUsername(this.requestParams().username, {
			projection: {
				_id: 1,
				username: 1,
			},
		}));
		if (!user) {
			return API.v1.notFound();
		}
		Users.unsetExtension(user._id);
		return API.v1.success();
	},
});

// Get free extensions
API.v1.addRoute('omnichannel.extension.free', { authRequired: true,
	permissionsRequired: ['manage-agent-extension-association'],
}, {
	get() {
		const extension = Promise.await(LivechatVoip.getAvailableExtensions());
		if (!extension) {
			return API.v1.notFound();
		}
		return API.v1.success({ extensions: extension.result });
	},
});

// Get free extensions
API.v1.addRoute('omnichannel.extension.allocated', { authRequired: true,
	permissionsRequired: ['manage-agent-extension-association'],
}, {
	get() {
		const association = Promise.await(LivechatVoip.getExtensionAllocationDetails());
		if (!association) {
			return API.v1.notFound();
		}
		return API.v1.success({ allocations: association.result });
	},
});
