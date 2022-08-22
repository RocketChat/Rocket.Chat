import { Match, check } from 'meteor/check';
import type { IUser, IVoipExtensionWithAgentInfo } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { API } from '../../api';
import { hasPermission } from '../../../../authorization/server/index';
import { LivechatVoip } from '../../../../../server/sdk';
import { logger } from './logger';

function filter(
	array: IVoipExtensionWithAgentInfo[],
	{ queues, extension, agentId, status }: { queues?: string[]; extension?: string; agentId?: string; status?: string },
): IVoipExtensionWithAgentInfo[] {
	const defaultFunc = (): boolean => true;
	return array.filter((item) => {
		const queuesCond = queues && Array.isArray(queues) ? (): boolean => item.queues?.some((q) => queues.includes(q)) || false : defaultFunc;
		const extensionCond = extension?.trim() ? (): boolean => item?.extension === extension : defaultFunc;
		const agentIdCond = agentId?.trim() ? (): boolean => item?.userId === agentId : defaultFunc;
		const statusCond = status?.trim() ? (): boolean => item?.state === status : defaultFunc;

		return queuesCond() && extensionCond() && agentIdCond() && statusCond();
	});
}

function paginate<T>(array: T[], count = 10, offset = 0): T[] {
	return array.slice(offset, offset + count);
}

const isUserAndExtensionParams = (p: any): p is { userId: string; extension: string } => p.userId && p.extension;
const isUserIdndTypeParams = (p: any): p is { userId: string; type: 'free' | 'allocated' | 'available' } => p.userId && p.type;

API.v1.addRoute(
	'omnichannel/agent/extension',
	{ authRequired: true },
	{
		async post() {
			if (!hasPermission(this.userId, 'manage-agent-extension-association')) {
				return API.v1.unauthorized();
			}
			check(
				this.bodyParams,
				Match.OneOf(
					Match.ObjectIncluding({
						username: String,
						extension: String,
					}),
					Match.ObjectIncluding({
						userId: String,
						extension: String,
					}),
				),
			);

			const { extension } = this.bodyParams;
			let user: IUser | null = null;

			if (!isUserAndExtensionParams(this.bodyParams)) {
				if (!this.bodyParams.username) {
					return API.v1.notFound();
				}
				user = await Users.findOneByAgentUsername(this.bodyParams.username, {
					projection: {
						_id: 1,
						username: 1,
					},
				});
			} else {
				if (!this.bodyParams.userId) {
					return API.v1.notFound();
				}
				user = await Users.findOneAgentById(this.bodyParams.userId, {
					projection: {
						_id: 1,
						username: 1,
					},
				});
			}

			if (!user) {
				return API.v1.notFound('User not found or does not have livechat-agent role');
			}

			try {
				logger.debug(`Setting extension ${extension} for agent with id ${user._id}`);
				await Users.setExtension(user._id, extension);
				return API.v1.success();
			} catch (e) {
				logger.error({ msg: 'Extension already in use' });
				return API.v1.failure(`extension already in use ${extension}`);
			}
		},
	},
);

API.v1.addRoute(
	'omnichannel/agent/extension/:username',
	{ authRequired: true },
	{
		// Get the extensions associated with the agent passed as request params.
		async get() {
			if (!hasPermission(this.userId, 'view-agent-extension-association')) {
				return API.v1.unauthorized();
			}
			check(
				this.urlParams,
				Match.ObjectIncluding({
					username: String,
				}),
			);
			const { username } = this.urlParams;
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
			});
			if (!extension) {
				return API.v1.notFound('Extension not found');
			}
			return API.v1.success({ extension });
		},

		async delete() {
			if (!hasPermission(this.userId, 'manage-agent-extension-association')) {
				return API.v1.unauthorized();
			}
			check(
				this.urlParams,
				Match.ObjectIncluding({
					username: String,
				}),
			);
			const { username } = this.urlParams;
			const user = await Users.findOneByAgentUsername(username, {
				projection: {
					_id: 1,
					username: 1,
					extension: 1,
				},
			});
			if (!user) {
				return API.v1.notFound();
			}
			if (!user.extension) {
				logger.debug(`User ${user._id} is not associated with any extension. Skipping`);
				return API.v1.success();
			}

			logger.debug(`Removing extension association for user ${user._id} (extension was ${user.extension})`);
			await Users.unsetExtension(user._id);
			return API.v1.success();
		},
	},
);

// Get free extensions
API.v1.addRoute(
	'omnichannel/extension',
	{ authRequired: true, permissionsRequired: ['manage-agent-extension-association'] },
	{
		async get() {
			check(
				this.queryParams,
				Match.OneOf(
					Match.ObjectIncluding({
						type: Match.OneOf('free', 'allocated', 'available'),
						userId: String,
					}),
					Match.ObjectIncluding({
						type: Match.OneOf('free', 'allocated', 'available'),
						username: String,
					}),
				),
			);
			const { type } = this.queryParams;
			switch ((type as string).toLowerCase()) {
				case 'free': {
					const extensions = await LivechatVoip.getFreeExtensions();
					if (!extensions) {
						return API.v1.failure('Error in finding free extensons');
					}
					return API.v1.success({ extensions });
				}
				case 'allocated': {
					const extensions = await LivechatVoip.getExtensionAllocationDetails();
					if (!extensions) {
						return API.v1.failure('Error in allocated extensions');
					}
					return API.v1.success({ extensions: extensions.map((e) => e.extension) });
				}
				case 'available': {
					let user: IUser | null = null;
					if (!isUserIdndTypeParams(this.queryParams)) {
						user = await Users.findOneByAgentUsername(this.queryParams.username, {
							projection: { _id: 1, extension: 1 },
						});
					} else {
						user = await Users.findOneAgentById(this.queryParams.userId, {
							projection: { _id: 1, extension: 1 },
						});
					}

					const freeExt = await LivechatVoip.getFreeExtensions();
					const extensions = user?.extension ? [user.extension, ...freeExt] : freeExt;
					return API.v1.success({ extensions });
				}
				default:
					return API.v1.notFound(`${type} not found `);
			}
		},
	},
);

API.v1.addRoute(
	'omnichannel/extensions',
	{ authRequired: true, permissionsRequired: ['manage-agent-extension-association'] },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { status, agentId, queues, extension } = this.requestParams();

			check(status, Match.Maybe(String));
			check(agentId, Match.Maybe(String));
			check(queues, Match.Maybe([String]));
			check(extension, Match.Maybe(String));

			const extensions = await LivechatVoip.getExtensionListWithAgentData();
			const filteredExts = filter(extensions, { status, agentId, queues, extension });

			// paginating in memory as Asterisk doesn't provide pagination for commands
			return API.v1.success({
				extensions: paginate(filteredExts, count, offset),
				offset,
				count,
				total: filteredExts.length,
			});
		},
	},
);

API.v1.addRoute(
	'omnichannel/agents/available',
	{ authRequired: true, permissionsRequired: ['manage-agent-extension-association'] },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const { text, includeExtension = '' } = this.queryParams;

			const { agents, total } = await LivechatVoip.getAvailableAgents(includeExtension, text, count, offset, sort);

			return API.v1.success({
				agents,
				offset,
				count,
				total,
			});
		},
	},
);
