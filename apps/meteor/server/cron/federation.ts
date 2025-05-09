import type { SettingValue } from '@rocket.chat/core-typings';
import { eventTypes } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { Users, Settings } from '@rocket.chat/models';

import { resolveSRV, resolveTXT } from '../../app/federation/server/functions/resolveDNS';
import { dispatchEvent } from '../../app/federation/server/handler';
import { getFederationDomain } from '../../app/federation/server/lib/getFederationDomain';
import { notifyOnSettingChangedById } from '../../app/lib/server/lib/notifyListener';
import { settings, settingsRegistry } from '../../app/settings/server';

async function updateSetting(id: string, value: SettingValue | null): Promise<void> {
	if (value !== null) {
		const setting = settings.get(id);

		if (setting === undefined) {
			await settingsRegistry.add(id, value);
		} else {
			// TODO: audit
			(await Settings.updateValueById(id, value)).modifiedCount && void notifyOnSettingChangedById(id);
		}
	} else {
		await Settings.updateValueById(id, null);
	}
}

async function runFederation(): Promise<void> {
	// Get the settings
	const siteUrl = settings.get('Site_Url') as string;
	const { protocol } = new URL(siteUrl);
	const rocketChatProtocol = protocol.slice(0, -1);

	const federationDomain = settings.get('FEDERATION_Domain') as string;

	// Load public key info
	try {
		const resolvedTXT = await resolveTXT(`rocketchat-public-key.${federationDomain}`);
		await updateSetting('FEDERATION_ResolvedPublicKeyTXT', resolvedTXT);
	} catch (err) {
		await updateSetting('FEDERATION_ResolvedPublicKeyTXT', null);
	}

	// Load legacy tcp protocol info
	try {
		const resolvedTXT = await resolveTXT(`rocketchat-tcp-protocol.${federationDomain}`);
		await updateSetting('FEDERATION_ResolvedProtocolTXT', resolvedTXT);
	} catch (err) {
		await updateSetting('FEDERATION_ResolvedProtocolTXT', null);
	}

	// Load SRV info
	try {
		// If there is a protocol entry on DNS, we use it
		const protocol = (settings.get('FEDERATION_ResolvedProtocolTXT') as string) ? 'tcp' : rocketChatProtocol;

		const resolvedSRV = await resolveSRV(`_rocketchat._${protocol}.${federationDomain}`);
		await updateSetting('FEDERATION_ResolvedSRV', JSON.stringify(resolvedSRV));
	} catch (err) {
		await updateSetting('FEDERATION_ResolvedSRV', '{}');
	}

	// Test if federation is healthy
	try {
		void dispatchEvent([getFederationDomain()], {
			type: eventTypes.PING,
		});

		await updateSetting('FEDERATION_Healthy', true);
	} catch (err) {
		await updateSetting('FEDERATION_Healthy', false);
	}

	// If federation is healthy, check if there are remote users
	if (settings.get('FEDERATION_Healthy') as boolean) {
		const user = await Users.findOne({ isRemote: true });

		await updateSetting('FEDERATION_Populated', !!user);
	}
}

export function federationCron(): void {
	const name = 'Federation';

	settings.watch('FEDERATION_Enabled', async (value) => {
		if (!value) {
			return cronJobs.remove(name);
		}

		await cronJobs.add(name, '* * * * *', async () => runFederation());
	});
}
