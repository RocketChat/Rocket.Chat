import { resolveSRV, resolveTXT } from '../../app/federation/server/functions/resolveDNS';
import { settings, SettingsVersion4 } from '../../app/settings/server';
import { SettingValue } from '../../definition/ISetting';
import { dispatchEvent } from '../../app/federation/server/handler';
import { getFederationDomain } from '../../app/federation/server/lib/getFederationDomain';
import { eventTypes } from '../../app/models/server/models/FederationEvents';
import { Users } from '../../app/models/server/raw';

function updateSetting(id: string, value: SettingValue | null): void {
	if (value !== null) {
		const setting = SettingsVersion4.get(id);

		if (setting === undefined) {
			settings.add(id, value);
		} else {
			settings.updateById(id, value);
		}
	} else {
		settings.clearById(id);
	}
}

async function runFederation(): Promise<void> {
	// Get the settings
	const siteUrl = SettingsVersion4.get('Site_Url') as string;
	const { protocol } = new URL(siteUrl);
	const rocketChatProtocol = protocol.slice(0, -1);

	const federationDomain = SettingsVersion4.get('FEDERATION_Domain') as string;

	// Load public key info
	try {
		const resolvedTXT = await resolveTXT(`rocketchat-public-key.${ federationDomain }`);
		updateSetting('FEDERATION_ResolvedPublicKeyTXT', resolvedTXT);
	} catch (err) {
		updateSetting('FEDERATION_ResolvedPublicKeyTXT', null);
	}

	// Load legacy tcp protocol info
	try {
		const resolvedTXT = await resolveTXT(`rocketchat-tcp-protocol.${ federationDomain }`);
		updateSetting('FEDERATION_ResolvedProtocolTXT', resolvedTXT);
	} catch (err) {
		updateSetting('FEDERATION_ResolvedProtocolTXT', null);
	}

	// Load SRV info
	try {
		// If there is a protocol entry on DNS, we use it
		const protocol = SettingsVersion4.get('FEDERATION_ResolvedProtocolTXT') as string ? 'tcp' : rocketChatProtocol;

		const resolvedSRV = await resolveSRV(`_rocketchat._${ protocol }.${ federationDomain }`);
		updateSetting('FEDERATION_ResolvedSRV', JSON.stringify(resolvedSRV));
	} catch (err) {
		updateSetting('FEDERATION_ResolvedSRV', '{}');
	}

	// Test if federation is healthy
	try {
		dispatchEvent([getFederationDomain()], {
			type: eventTypes.PING,
		});

		updateSetting('FEDERATION_Healthy', true);
	} catch (err) {
		updateSetting('FEDERATION_Healthy', false);
	}

	// If federation is healthy, check if there are remote users
	if (SettingsVersion4.get('FEDERATION_Healthy') as boolean) {
		const user = await Users.findOne({ isRemote: true });

		updateSetting('FEDERATION_Populated', !!user);
	}
}

export function federationCron(SyncedCron: any): void {
	SettingsVersion4.watch('FEDERATION_Enabled', (value) => {
		if (!value) {
			return SyncedCron.remove('Federation');
		}
		SyncedCron.add({
			name: 'Federation',
			schedule(parser: any) {
				return parser.cron('* * * * *');
			},
			job: runFederation,
		});
	});
}
