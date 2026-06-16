import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { Pexip, PexipVideoConfProvider } from '@rocket.chat/pexip';

import { settings } from '../../app/settings/server';
import { getPexipSettings } from '../settings/pexip';

const providers = new Map<string, { capabilities: VideoConferenceCapabilities; label: string; appId: string }>();

type Provider = { key: string; label: string };

export const videoConfProviders = {
	registerProvider(providerName: string, capabilities: VideoConferenceCapabilities, appId: string): void {
		providers.set(providerName.toLowerCase(), { capabilities, label: providerName, appId });
	},

	unRegisterProvider(providerName: string): void {
		const key = providerName.toLowerCase();

		if (providers.has(key)) {
			providers.delete(key);
		}
	},

	getActiveProvider(): string | undefined {
		// The internal pexip provider lives outside the `providers` map (it's gated by a setting, not
		// registered by an app), so not having provider apps only skips the default provider check
		if (providers.size !== 0) {
			const defaultProvider = settings.get<string>('VideoConf_Default_Provider');

			if (defaultProvider) {
				if (this.isProviderAvailable(defaultProvider)) {
					return defaultProvider;
				}

				return;
			}
		}

		if (this.isProviderAvailable('core.pexip')) {
			return 'core.pexip';
		}

		if (providers.size === 1) {
			const [[name]] = [...providers];
			return name;
		}
	},

	hasAnyProvider(): boolean {
		return providers.size > 0 || settings.get<boolean>('Pexip_Integration_Enabled');
	},

	getRegisteredProviders(): Provider[] {
		return [...providers.keys()].map((key) => ({ key, label: providers.get(key)?.label || key }));
	},

	getInternalProviders(): Provider[] {
		const pexip = this.getPexipProvider();

		if (pexip) {
			return [pexip];
		}

		return [];
	},

	getPexipProvider(): Provider | null {
		if (!settings.get<boolean>('Pexip_Integration_Enabled')) {
			return null;
		}

		return { key: 'core.pexip', label: 'Pexip_Integration' };
	},

	getAllProviders(): Provider[] {
		const registeredProviders = [...providers.keys()].map((key) => ({ key, label: providers.get(key)?.label || key }));
		const internalProviders = this.getInternalProviders();

		return [...registeredProviders, ...internalProviders];
	},

	isProviderAvailable(name: string): boolean {
		if (name === 'core.pexip') {
			return settings.get<boolean>('Pexip_Integration_Enabled');
		}

		return providers.has(name);
	},

	getProviderCapabilities(name: string): VideoConferenceCapabilities | undefined {
		if (name === 'core.pexip') {
			return {
				mic: false,
				cam: false,
				title: true,
				persistentChat: true,
			};
		}

		const key = name.toLowerCase();
		if (!providers.has(key)) {
			return;
		}

		return providers.get(key)?.capabilities;
	},

	getProviderAppId(name: string): string | undefined {
		const key = name.toLowerCase();
		if (key === 'core.pexip') {
			return undefined;
		}

		if (!providers.has(key)) {
			return;
		}

		return providers.get(key)?.appId;
	},

	getVideoConfProviderHandler(providerName: string): PexipVideoConfProvider | null {
		if (providerName === 'core.pexip') {
			return this.getPexipHandler();
		}

		return null;
	},

	getPexipHandler() {
		const pexipSettings = getPexipSettings();

		const pexip = new Pexip(pexipSettings);
		return new PexipVideoConfProvider(pexip);
	},
};
