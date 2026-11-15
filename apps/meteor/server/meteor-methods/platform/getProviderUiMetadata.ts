import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { TranslationProviderRegistry } from '../../lib/autotranslate/autotranslate';
import { methodDeprecationLogger } from '../../lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		/** @deprecated Use `GET /v1/autotranslate.getProviderUiMetadata` instead. */
		'autoTranslate.getProviderUiMetadata'(): Record<string, { name: string; displayName: string }>;
	}
}

Meteor.methods<ServerMethods>({
	'autoTranslate.getProviderUiMetadata'() {
		methodDeprecationLogger.method('autoTranslate.getProviderUiMetadata', '9.0.0', '/v1/autotranslate.getProviderUiMetadata');

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
