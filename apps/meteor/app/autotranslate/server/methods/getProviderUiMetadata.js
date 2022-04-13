import { Meteor } from 'meteor/meteor';

import { TranslationProviderRegistry } from '../autotranslate';

Meteor.methods({
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
