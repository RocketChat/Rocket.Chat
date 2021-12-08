import { Match, check } from 'meteor/check';

import { API } from '../../api';
import { Users } from '../../../../models/server/raw/index';
import { hasPermission } from '../../../../authorization/server/index';
import { LivechatVoip } from '../../../../../server/sdk';

API.v1.addRoute('omnichannel/agent/extension', { authRequired: true }, {
	// Get the extensions associated with the agent passed as request params.
	async get() {
		if (!hasPermission(this.userId, 'view-agent-extension-association')) {
			return API.v1.unauthorized();
		}
		check(this.requestParams(), Match.ObjectIncluding({
			username: String,
		}));
		const { username } = this.requestParams();
		const user = await Users.findOneByAgentUsername(username, {
			projection: { _id: 1 },
		});
		if (!user) {
			return API.v1.notFound('User not found');
		}
		const extension = await Users.getVoipExtensionByUserId(user._id, {
			projection: {
				_id: 1,
				username: 1,
				extension: 1,
			},
		}).toArray();
		if (!extension) {
			return API.v1.notFound('Extension not found');
		}
		return API.v1.success({ extension });
	},

	// Create agent-extension association.
	async post() {
		if (!hasPermission(this.userId, 'manage-agent-extension-association')) {
			return API.v1.unauthorized();
		}
		check(this.bodyParams, {
			username: String,
			extension: String,
		});
		const { username, extension } = this.bodyParams;
		const user = await Users.findOneByAgentUsername(username, {
			projection: {
				_id: 1,
				username: 1,
			},
		});
		if (!user) {
			return API.v1.notFound();
		}
		await Users.setExtension(user._id, extension);
		return API.v1.success();
	},
	async delete() {
		if (!hasPermission(this.userId, 'manage-agent-extension-association')) {
			return API.v1.unauthorized();
		}
		check(this.requestParams(), Match.ObjectIncluding({
			username: String,
		}));
		const { username } = this.requestParams();
		const user = await Users.findOneByAgentUsername(username, {
			projection: {
				_id: 1,
				username: 1,
			},
		});
		if (!user) {
			return API.v1.notFound();
		}
		await Users.unsetExtension(user._id);
		return API.v1.success();
	},
});

// Get free extensions
API.v1.addRoute('omnichannel/extension', { authRequired: true,
	permissionsRequired: ['manage-agent-extension-association'],
}, {
	async get() {
		check(this.queryParams, Match.ObjectIncluding({
			type: String,
			agentId: Match.Maybe(String),
		}));
		const { type, username } = this.queryParams;
		switch ((type as string).toLowerCase()) {
			case 'free': {
				const extension = await LivechatVoip.getFreeExtensions();
				if (!extension) {
					return API.v1.failure('Error in finding free extensons');
				}
				return API.v1.success({ extensions: extension.result });
			}
			case 'allocated': {
				const association = await LivechatVoip.getExtensionAllocationDetails();
				if (!association) {
					return API.v1.failure('Error in allocated extensions');
				}
				return API.v1.success({ allocations: association.result });
			}
			case 'available': {
				const user = await Users.findOneByAgentUsername(username, {
					projection: { _id: 1 },
				});
				if (!user) {
					return API.v1.notFound('User not found');
				}
				const extension = await Users.getVoipExtensionByUserId(user._id, {
					projection: {
						_id: 1,
						username: 1,
						extension: 1,
					},
				}).toArray();
				const freeExt = await LivechatVoip.getFreeExtensions();
				const extensions = [];
				for (let i = 0; i < extension.length; i++) {
					extensions.push(extension[i].extension);
				}
				for (let i = 0; i < freeExt.result.length; i++) {
					extensions.push(freeExt.result[i]);
				}
				return API.v1.success({ available: extensions });
			}
			default:
				return API.v1.notFound(`${ type } not found `);
		}
	},
});
