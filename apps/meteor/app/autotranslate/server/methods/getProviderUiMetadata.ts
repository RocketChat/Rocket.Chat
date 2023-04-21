import { Meteor } from 'meteor/meteor';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { TranslationProviderRegistry } from '../autotranslate';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'autoTranslate.getProviderUiMetadata'(): Record<string, { name: string; displayName: string }>;
	}
}

Meteor.methods<ServerMethods>({
	async 'autoTranslate.getProviderUiMetadata'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-action-not-allowed', 'Login neccessary', {
				method: 'autoTranslate.getProviderUiMetadata',
			});
		}

		return Object.fromEntries(
			await Promise.all(
				TranslationProviderRegistry.getProviders().map(async (provider) => {
					const { name, displayName } = await provider._getProviderMetadata();
					return [name, { name, displayName }];
				}),
			),
		);
	},
});
