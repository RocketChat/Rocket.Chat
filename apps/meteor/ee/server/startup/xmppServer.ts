import { api, XMPPServer as XMPPServerService } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';
import { Logger } from '@rocket.chat/logger';
import { XMPPServerService as XMPPServerServiceClass } from '@rocket.chat/xmpp-server';

import { settings } from '../../../server/settings';

const logger = new Logger('XMPPServer');

const XMPP_SETTING_KEYS = [
	'XMPP_Server_Enabled',
	'XMPP_Server_Domain',
	'XMPP_Server_Port',
	'XMPP_Server_TLS_Certificate',
	'XMPP_Server_TLS_Key',
	'XMPP_Server_MUC_Subdomain',
	'XMPP_Server_Domain_Allow_List',
	'XMPP_Server_Presence_Enabled',
] as const;

const parseAllowList = (raw: string): string[] =>
	raw
		.split(',')
		.map((entry) => entry.trim())
		.filter(Boolean);

const configureXMPPServer = async (): Promise<void> => {
	const enabled = (await License.hasModule('federation')) && settings.get<boolean>('XMPP_Server_Enabled');

	if (!enabled) {
		await XMPPServerService.stop();
		return;
	}

	try {
		await XMPPServerService.configure({
			enabled: true,
			domain: settings.get<string>('XMPP_Server_Domain'),
			port: settings.get<number>('XMPP_Server_Port'),
			tlsCert: settings.get<string>('XMPP_Server_TLS_Certificate'),
			tlsKey: settings.get<string>('XMPP_Server_TLS_Key'),
			mucSubdomain: settings.get<string>('XMPP_Server_MUC_Subdomain'),
			domainAllowList: parseAllowList(settings.get<string>('XMPP_Server_Domain_Allow_List')),
			presenceEnabled: settings.get<boolean>('XMPP_Server_Presence_Enabled'),
		});
	} catch (err) {
		logger.error({ msg: 'Failed to configure native XMPP server', err });
	}
};

export const startXMPPServerService = async (): Promise<void> => {
	api.registerService(new XMPPServerServiceClass());

	settings.watchMultiple([...XMPP_SETTING_KEYS], () => {
		void configureXMPPServer();
	});

	License.onToggledFeature('federation', {
		up: () => configureXMPPServer(),
		down: () => XMPPServerService.stop(),
	});
};
