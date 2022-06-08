import { settings } from '../../app/settings/server';

const providers = new Set<string>();

export const videoConfProviders = {
	registerProvider(providerName: string): void {
		providers.add(providerName);
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

		if (providers.has(defaultProvider)) {
			return defaultProvider;
		}

		const [name] = providers;
		return name;
	},

	getProviderList(): { key: string; label: string }[] {
		return [...providers].map((key) => ({ key, label: key }));
	},

	isProviderAvailable(name: string): boolean {
		return providers.has(name);
	},
};
