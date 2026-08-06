import { api, FederationMatrix as FederationMatrixService } from '@rocket.chat/core-services';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { FederationMatrix, configureFederationMatrixSettings, setupFederationMatrix } from '@rocket.chat/federation-matrix';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { License } from '@rocket.chat/license';
import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';

import { i18n } from '../../../server/lib/i18n';
import { slashCommands } from '../../../server/lib/utils/slashCommand';
import { StreamerCentral } from '../../../server/modules/streamer/streamer.module';
import { settings } from '../../../server/settings';
import { registerFederationRoutes } from '../api/federation';

const logger = new Logger('Federation');

let serviceEnabled = false;

const configureFederation = async () => {
	// only registers the typing listener if the service is enabled
	serviceEnabled = (await License.hasModule('federation')) && settings.get('Federation_Service_Enabled');
	if (!serviceEnabled) {
		return;
	}

	try {
		await configureFederationMatrixSettings({
			instanceId: InstanceStatus.id(),
			domain: settings.get('Federation_Service_Domain'),
			signingKey: settings.get('Federation_Service_Matrix_Signing_Key'),
			signingAlgorithm: settings.get('Federation_Service_Matrix_Signing_Algorithm'),
			signingVersion: settings.get('Federation_Service_Matrix_Signing_Version'),
			allowedEncryptedRooms: settings.get('Federation_Service_Join_Encrypted_Rooms'),
			allowedNonPrivateRooms: settings.get('Federation_Service_Join_Non_Private_Rooms'),
			processEDUTyping: settings.get('Federation_Service_EDU_Process_Typing'),
			processEDUPresence: settings.get('Federation_Service_EDU_Process_Presence'),
			processEDUReceipt: settings.get('Federation_Service_EDU_Process_Receipt'),
			xmppEnabled: settings.get('Federation_XMPP_Enabled'),
			xmppBridgeURL: settings.get('Federation_XMPP_Bridge_URL'),
			xmppBridgeHSToken: settings.get('Federation_XMPP_Bridge_HS_Token'),
			xmppBridgeASToken: settings.get('Federation_XMPP_Bridge_AS_Token'),
		});
	} catch (err) {
		logger.error({ msg: 'Failed to start federation-matrix service', err });
	}
};

export const startFederationService = async (): Promise<void> => {
	api.registerService(new FederationMatrix());

	await registerFederationRoutes();

	// TODO move to service/setup?
	StreamerCentral.on('broadcast', (name, eventName, args) => {
		if (!serviceEnabled) {
			return;
		}

		if (name === 'notify-room' && eventName.endsWith('user-activity')) {
			const [rid] = eventName.split('/');
			const [user, activity] = args;
			void FederationMatrixService.notifyUserTyping(rid, user, activity.includes('user-typing'));
		}
	});

	// `setupFederationMatrix()` runs the SDK's `init()`, which registers the DB
	// collections (including `AppServiceStateCollection`). It must complete
	// before the settings watcher below, whose initial fire calls `setConfig`
	// and resolves repositories that depend on those collections.
	try {
		await setupFederationMatrix();
	} catch (err) {
		logger.error({ msg: 'Failed to setup federation-matrix:', err });
	}

	settings.watchMultiple(
		[
			'Federation_Service_Enabled',
			'Federation_Service_Domain',
			'Federation_Service_EDU_Process_Typing',
			'Federation_Service_EDU_Process_Presence',
			'Federation_Service_EDU_Process_Receipt',
			'Federation_Service_Matrix_Signing_Key',
			'Federation_Service_Matrix_Signing_Algorithm',
			'Federation_Service_Matrix_Signing_Version',
			'Federation_Service_Join_Encrypted_Rooms',
			'Federation_Service_Join_Non_Private_Rooms',
			'Federation_XMPP_Enabled',
			'Federation_XMPP_Bridge_URL',
			'Federation_XMPP_Bridge_HS_Token',
			'Federation_XMPP_Bridge_AS_Token',
		],
		async () => {
			await configureFederation();
		},
	);

	slashCommands.add({
		command: 'xmpp-join',
		callback: async ({ params, message, userId }: SlashCommandCallbackParams<'xmpp-join'>): Promise<void> => {
			// the helper advertises `#channel`, so accept the leading # and strip it before joining
			const channel = params.trim().replace(/^#/, '');
			if (!channel) {
				void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
					msg: i18n.t('Federation_XMPP_Join_Channel_Required', {
						lng: settings.get('Language') || 'en',
					}),
				});
				return;
			}

			const user = await Users.findOneById(userId);
			if (!user) {
				logger.error({ msg: 'User not found for joining xmpp room', userId });
				return;
			}

			const joined = await FederationMatrixService.joinAppServiceRoom(`_xmpp_${channel}`, user);

			const lng = settings.get<string>('Language') || 'en';
			if (joined) {
				void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
					msg: `${i18n.t('Federation_XMPP_Join_Channel_Success', { lng })}`,
				});
			} else {
				void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
					msg: `${i18n.t('Federation_XMPP_Join_Channel_Failed', { lng })}`,
				});
			}
		},
		options: {
			description: 'Join xmpp rooms',
			params: '#channel',
		},
	});
};
