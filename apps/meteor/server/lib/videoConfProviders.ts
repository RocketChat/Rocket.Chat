import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';

import { settings } from '../settings';

// `appId === 'core'` marks a built-in provider (e.g. LiveKit) — registered
// directly from server bootstrap rather than via an apps-engine app. The
// only behavioural impact is when callers look up the owning app to dispatch
// provider hooks; built-ins have no app to dispatch to.
export const CORE_PROVIDER_APP_ID = 'core';

const providers = new Map<string, { capabilities: VideoConferenceCapabilities; label: string; appId: string }>();

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
		return [...providers.keys()].map((key) => ({ key, label: providers.get(key)?.label || key }));
	},

	isProviderAvailable(name: string): boolean {
		return providers.has(name);
	},

	getProviderCapabilities(name: string): VideoConferenceCapabilities | undefined {
		const key = name.toLowerCase();
		if (!providers.has(key)) {
			return;
		}

		return providers.get(key)?.capabilities;
	},

	getProviderAppId(name: string): string | undefined {
		const key = name.toLowerCase();

		if (!providers.has(key)) {
			return;
		}

		return providers.get(key)?.appId;
	},
};
