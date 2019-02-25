import { TranslationProviderRegistry } from '../autotranslate';

Meteor.methods({
	'autoTranslate.getProviderUiMetadata'() {
		const providersMetadata = {};
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-action-not-allowed', 'Login neccessary', { method: 'autoTranslate.getProviderUiMetadata' });
		}
		for (const provider in TranslationProviderRegistry._providers) {
			if (TranslationProviderRegistry._providers.hasOwnProperty(provider)) {
				const { name, displayName } = TranslationProviderRegistry._providers[provider]._getProviderMetadata();
				providersMetadata[provider] = { name, displayName };
			}
		}
		return providersMetadata;
	},
});

