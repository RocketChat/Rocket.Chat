import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { TranslationProviderRegistry } from '../autotranslate';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'autoTranslate.getProviderUiMetadata'(): Record<string, { name: string; displayName: string }>;
	}
}

Meteor.methods<ServerMethods>({
	'autoTranslate.getProviderUiMetadata'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-action-not-allowed', 'Login neccessary', {
				method: 'autoTranslate.getProviderUiMetadata',
			});
		}

		return Object.fromEntries(
			TranslationProviderRegistry.getProviders().map((provider) => {
				const { name, displayName } = provider._getProviderMetadata();
				return [name, { name, displayName }];
			}),
		);
	},
});
