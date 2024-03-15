import { LivechatVoip } from '@rocket.chat/core-services';
import type { IUser, IVoipExtensionWithAgentInfo } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { isOmnichannelAgentExtensionPOSTProps, isOmnichannelExtensionProps, isOmnichannelExtensionsProps } from '@rocket.chat/rest-typings';

import { API } from '../../api';
import { getPaginationItems } from '../../helpers/getPaginationItems';
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
	{ authRequired: true, permissionsRequired: ['manage-agent-extension-association'], validateParams: isOmnichannelAgentExtensionPOSTProps },
	{
		async post() {
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
	{
		authRequired: true,
		permissionsRequired: {
			GET: ['view-agent-extension-association'],
			DELETE: ['manage-agent-extension-association'],
		},
	},
	{
		// Get the extensions associated with the agent passed as request params.
		async get() {
			const { username } = this.urlParams;
			if (!username) {
				throw new Error('error-invalid-param');
			}

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
			const { username } = this.urlParams;
			if (!username) {
				throw new Error('error-invalid-param');
			}

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
	{ authRequired: true, permissionsRequired: ['manage-agent-extension-association'], validateParams: isOmnichannelExtensionProps },
	{
		async get() {
			switch (this.queryParams.type.toLowerCase()) {
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
					return API.v1.notFound(`${this.queryParams.type} not found `);
			}
		},
	},
);

API.v1.addRoute(
	'omnichannel/extensions',
	{ authRequired: true, permissionsRequired: ['manage-agent-extension-association'], validateParams: isOmnichannelExtensionsProps },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { status, agentId, queues, extension } = this.queryParams;

			const extensions = await LivechatVoip.getExtensionListWithAgentData();
			const filteredExts = filter(extensions, {
				status: status ?? undefined,
				agentId: agentId ?? undefined,
				queues: queues ?? undefined,
				extension: extension ?? undefined,
			});

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
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
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
