import { VideoConferenceCapabilities } from '@rocket.chat/core-typings';

import { settings } from '../../app/settings/server';

const providers = new Map<string, VideoConferenceCapabilities>();

export const videoConfProviders = {
	registerProvider(providerName: string, capabilities: VideoConferenceCapabilities): void {
		providers.set(providerName, capabilities);
	},

	unRegisterProvider(providerName: string): void {
		if (providers.has(providerName)) {
			providers.delete(providerName);
		}
	},

	getActiveProvider(): string | undefined {
		if (providers.size === 0) {
			return;
		}
		const defaultProvider = settings.get<string>('VideoConf_Default_Provider');

		if (defaultProvider) {
			if (providers.has(defaultProvider)) {
				return defaultProvider;
			}

			return;
		}

		if (providers.size === 1) {
			const [[name]] = [...providers];
			return name;
		}
	},

	hasAnyProvider(): boolean {
		return providers.size > 0;
	},

	getProviderList(): { key: string; label: string }[] {
		return [...providers.keys()].map((key) => ({ key, label: key }));
	},

	isProviderAvailable(name: string): boolean {
		return providers.has(name);
	},

	getProviderCapabilities(name: string): VideoConferenceCapabilities | undefined {
		if (!providers.has(name)) {
			return;
		}

		return providers.get(name);
	},
};
