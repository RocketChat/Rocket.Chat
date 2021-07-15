import { resolveSRV, resolveTXT } from '../../app/federation/server/functions/resolveDNS';
import { settings } from '../../app/settings/server';
import { SettingValue } from '../../definition/ISetting';

function updateSetting(id: string, value: SettingValue): void {
	const setting = settings.get(id);
	if (!setting) {
		settings.add(id, value);
	} else {
		settings.updateById(id, value);
	}
}

async function runFederation(): Promise<void> {
	// Get the settings
	const siteUrl = settings.get('Site_Url') as string;
	const { protocol } = new URL(siteUrl);
	const rocketChatProtocol = protocol.slice(0, -1);

	const federationDomain = settings.get('FEDERATION_Domain') as string;

	try {
		const resolvedSRV = await resolveSRV(`_rocketchat._${ rocketChatProtocol }.${ federationDomain }`);
		updateSetting('FEDERATION_ResolvedSRV', JSON.stringify(resolvedSRV));
	} catch (err) {
		updateSetting('FEDERATION_ResolvedSRV', '{}');
	}

	try {
		const resolvedTXT = await resolveTXT(`rocketchat-public-key.${ federationDomain }`);
		updateSetting('FEDERATION_ResolvedPublicKeyTXT', resolvedTXT);
	} catch (err) {
		updateSetting('FEDERATION_ResolvedPublicKeyTXT', '');
	}

	try {
		const resolvedTXT = await resolveTXT(`rocketchat-tcp-protocol.${ federationDomain }`);
		updateSetting('FEDERATION_ResolvedProtocolTXT', resolvedTXT);
	} catch (err) {
		updateSetting('FEDERATION_ResolvedProtocolTXT', '');
	}
}

export function federationCron(SyncedCron: any): void {
	SyncedCron.add({
		name: 'Federation',
		schedule(parser: any) {
			return parser.cron('* * * * *');
		},
		job: runFederation,
	});
}
