import Bridge from './irc-bridge';
import { settings } from '../../settings/cached';

let current: Bridge | undefined;

export async function startIrcBridge(): Promise<void> {
	const config = {
		server: {
			protocol: settings.get('IRC_Protocol'),
			host: settings.get('IRC_Host'),
			port: settings.get('IRC_Port'),
			name: settings.get('IRC_Name'),
			description: settings.get('IRC_Description'),
		},
		passwords: {
			local: settings.get('IRC_Local_Password'),
			peer: settings.get('IRC_Peer_Password'),
		},
	};

	current = new Bridge(config);
	await current.init();
}
