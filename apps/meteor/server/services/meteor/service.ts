/* eslint-disable react-hooks/rules-of-hooks */
import { api, ServiceClassInternal } from '@rocket.chat/core-services';
import type { AutoUpdateRecord, IMeteor } from '@rocket.chat/core-services';
import type { ILivechatAgent, LoginServiceConfiguration, UserStatus } from '@rocket.chat/core-typings';
import { LoginServiceConfiguration as LoginServiceConfigurationModel, Users } from '@rocket.chat/models';
import { wrapExceptions } from '@rocket.chat/tools';
import { Meteor } from 'meteor/meteor';

import { processOnChange, serviceConfigCallbacks } from './userReactivity';
import { isOutgoingIntegration } from '../../../app/integrations/server/lib/definition';
import { triggerHandler } from '../../../app/integrations/server/lib/triggerHandler';
import { notifyGuestStatusChanged } from '../../../app/livechat/server/lib/guests';
import { onlineAgents, monitorAgents } from '../../../app/livechat/server/lib/stream/agentStatus';
import { metrics } from '../../../app/metrics/server';
import notifications from '../../../app/notifications/server/lib/Notifications';
import { settings } from '../../../app/settings/server';
import { use } from '../../../app/settings/server/Middleware';
import { setValue, updateValue } from '../../../app/settings/server/raw';
import { getURL } from '../../../app/utils/server/getURL';
import { configureEmailInboxes } from '../../features/EmailInbox/EmailInbox';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { ListenersModule } from '../../modules/listeners/listeners.module';

const disableMsgRoundtripTracking = ['yes', 'true'].includes(String(process.env.DISABLE_MESSAGE_ROUNDTRIP_TRACKING).toLowerCase());

settings.set = use(settings.set, (context, next) => {
	next(...context);
	const [record] = context;
	updateValue(record._id, record);
});

const clientVersionsStore = new Map<string, AutoUpdateRecord>();

export class MeteorService extends ServiceClassInternal implements IMeteor {
	protected name = 'meteor';

	constructor() {
		super();

		new ListenersModule(this, notifications);

		this.onEvent('watch.settings', async ({ clientAction, setting }): Promise<void> => {
			if (clientAction !== 'removed') {
				settings.set(setting);
				return;
			}

			settings.set({ ...setting, value: undefined });
			setValue(setting._id, undefined);
		});

		this.onEvent('watch.loginServiceConfiguration', ({ clientAction, id, data }) => {
			if (clientAction === 'removed') {
				serviceConfigCallbacks.forEach((callbacks) => {
					wrapExceptions(() => callbacks.removed?.(id)).suppress();
				});
				return;
			}

			if (data) {
				serviceConfigCallbacks.forEach((callbacks) => {
					wrapExceptions(() => callbacks[clientAction === 'inserted' ? 'added' : 'changed']?.(id, data)).suppress();
				});
			}
		});

		this.onEvent('watch.users', async (data) => {
			if (data.clientAction === 'updated' && data.diff) {
				processOnChange(data.diff, data.id);
			}

			if (!monitorAgents) {
				return;
			}

			if (data.clientAction !== 'removed' && 'diff' in data && !data.diff.status && !data.diff.statusLivechat) {
				return;
			}

			switch (data.clientAction) {
				case 'updated':
				case 'inserted':
					const agent = await Users.findOneAgentById<Pick<ILivechatAgent, 'status' | 'statusLivechat'>>(data.id, {
						projection: {
							status: 1,
							statusLivechat: 1,
						},
					});
					const serviceOnline = agent && agent.status !== 'offline' && agent.statusLivechat === 'available';

					if (serviceOnline) {
						return onlineAgents.add(data.id);
					}

					onlineAgents.remove(data.id);

					break;
				case 'removed':
					onlineAgents.remove(data.id);
					break;
			}
		});

		this.onEvent('watch.integrations', async ({ clientAction, id, data }) => {
			switch (clientAction) {
				case 'inserted':
					if (isOutgoingIntegration(data)) {
						triggerHandler.addIntegration(data);
					}
					break;
				case 'updated':
					if (isOutgoingIntegration(data)) {
						triggerHandler.removeIntegration(data);
						triggerHandler.addIntegration(data);
					}
					break;
				case 'removed':
					triggerHandler.removeIntegration({ _id: id });
					break;
			}
		});

		this.onEvent('watch.emailInbox', async () => {
			await configureEmailInboxes();
		});

		if (!disableMsgRoundtripTracking) {
			this.onEvent('watch.messages', async ({ message }) => {
				if (message?._updatedAt instanceof Date) {
					metrics.messageRoundtripTime.observe(Date.now() - message._updatedAt.getTime());
				}
			});
		}
	}

	override async started(): Promise<void> {
		// Even after server startup, client versions might not be updated yet, the only way
		// to make sure we can send the most up to date versions is using the publication below.
		// Since it receives each document one at a time, we have to store them to be able to send
		// them all when needed (i.e.: on ddp-streamer startup).
		Meteor.server.publish_handlers.meteor_autoupdate_clientVersions.call({
			added(_collection: string, _id: string, version: AutoUpdateRecord) {
				clientVersionsStore.set(_id, version);
				void api.broadcast('meteor.clientVersionUpdated', version);
			},
			changed(_collection: string, _id: string, version: AutoUpdateRecord) {
				clientVersionsStore.set(_id, version);
				void api.broadcast('meteor.clientVersionUpdated', version);
			},
			onStop() {
				//
			},
			ready() {
				//
			},
		});
	}

	async getAutoUpdateClientVersions(): Promise<Record<string, AutoUpdateRecord>> {
		return Object.fromEntries(clientVersionsStore);
	}

	async getLoginServiceConfiguration(): Promise<LoginServiceConfiguration[]> {
		return LoginServiceConfigurationModel.find({}, { projection: { secret: 0 } }).toArray();
	}

	async callMethodWithToken(
		userId: string,
		token: string,
		method: string,
		args: any[],
	): Promise<{
		result: unknown;
	}> {
		const user = await Users.findOneByIdAndLoginHashedToken(userId, token, {
			projection: { _id: 1 },
		});
		if (!user) {
			return {
				result: await Meteor.callAsync(method, ...args),
			};
		}

		return {
			result: await Meteor.runAsUser(userId, () => Meteor.callAsync(method, ...args)),
		};
	}

	async notifyGuestStatusChanged(token: string, status: UserStatus): Promise<void> {
		return notifyGuestStatusChanged(token, status);
	}

	async getURL(path: string, params: Record<string, any> = {}, cloudDeepLinkUrl?: string): Promise<string> {
		return getURL(path, params, cloudDeepLinkUrl);
	}

	async getMessageURLToReplyTo(roomType: string, roomId: string, messageIdToReplyTo: string): Promise<string> {
		return getURL(`${roomCoordinator.getRouteLink(roomType, { rid: roomId })}?msg=${messageIdToReplyTo}`, { full: true });
	}
}
