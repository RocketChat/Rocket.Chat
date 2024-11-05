import { settings } from '../../app/settings/server';

const providers = new Map<string, { enabled: boolean; label: string; appId: string }>();

export const contactVerificationAppProvider = {
	registerProvider(providerName: string, appId: string): void {
		providers.set(providerName.toLowerCase(), { enabled: true, label: providerName, appId });
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
		const contactVerificationApp = settings.get<string>('Livechat_Contact_Verification_App');
		if (contactVerificationApp) {
			if (providers.has(contactVerificationApp) && providers.get(contactVerificationApp)?.enabled) {
				return contactVerificationApp;
			}
		}
	},

	enableProvider(providerName: string): void {
		const key = providerName.toLowerCase();
		if (providers.has(key)) {
			const provider = providers.get(key);
			if (provider) {
				provider.enabled = true;
			}
		}
	},

	disableProvider(providerName: string): void {
		const key = providerName.toLowerCase();
		if (providers.has(key)) {
			const provider = providers.get(key);
			if (provider) {
				provider.enabled = false;
			}
		}
	},

	getProviderList(): { key: string; label: string }[] {
		return [...providers.keys()].map((key) => ({ key, label: providers.get(key)?.label || key }));
	},

	getProviderAppId(name: string): string | undefined {
		const key = name.toLowerCase();

		if (!providers.has(key)) {
			return;
		}

		return providers.get(key)?.appId;
	},
};
