/* globals RocketChat */
import _ from 'underscore';

class RecognitionProviderService {

	constructor() {
		this.providers = {};
		this.activeProvider = undefined;
	}

	use(id) {

		return new Promise((resolve, reject) => {
			if (!this.providers[id]) { throw new Error(`provider ${ id } cannot be found`); }

			let reason = 'switch';

			if (!this.activeProvider) {
				reason = 'startup';
			} else if (this.activeProvider.key === this.providers[id].key) {
				reason = 'update';
			}
			const stopProvider = () => {
				return new Promise((resolve, reject) => {
					if (this.activeProvider) {

						console.log(`Stopping provider '${ this.activeProvider.key }'`);

						this.activeProvider.stop(resolve, reject);
					} else {
						resolve();
					}
				});
			};

			stopProvider().then(() => {
				this.activeProvider = undefined;

				console.log(`Start provider '${ id }'`);

				try {

					this.providers[id].run(reason).then(() => {
						this.activeProvider = this.providers[id];
						resolve();
					}, reject);

				} catch (e) {
					reject(e);
				}
			}, reject);

		});

	}

	register(provider) {
		this.providers[provider.key] = provider;
	}

	start() {
		console.log('Load data for all providers');

		const providers = this.providers;

		//add settings for admininistration
		RocketChat.settings.addGroup('VoiceRecognition', function() {

			const self = this;

			self.add('VoiceRecognition.Provider', 'webkitSpeechProvider', {
				type: 'select',
				values: Object.keys(providers).map((key) => {
					return {
						key,
						i18nLabel: providers[key].i18nLabel
					};
				}),
				public: true,
				i18nLabel: 'VoiceRecognition_Provider'
			});

			Object.keys(providers)
				.filter((key) => providers[key].settings && providers[key].settings.length > 0)
				.forEach(function(key) {
					self.section(providers[key].i18nLabel, function() {
						providers[key].settings.forEach((setting) => {

							const _options = {
								type: setting.type,
								...setting.options
							};

							_options.enableQuery = _options.enableQuery || [];

							_options.enableQuery.push({
								_id: 'VoiceRecognition.Provider',
								value: key
							});

							this.add(setting.id, setting.defaultValue, _options);
						});
					});
				});
		});

		//add listener to react on setting changes
		const configProvider = _.debounce(Meteor.bindEnvironment(() => {
			const providerId = RocketChat.settings.get('VoiceRecognition.Provider');

			if (providerId) {
				this.use(providerId);
			}

		}), 1000);

		RocketChat.settings.get(/^VoiceRecognition\./, configProvider);
	}

}

export const recognitionProviderService = new RecognitionProviderService();

Meteor.startup(() => {
	recognitionProviderService.start();
});

Meteor.methods({
	'rocketchatAudio.getRecognitionProvider'() {
		if (!recognitionProviderService.activeProvider) { return undefined; }

		return {
			key: recognitionProviderService.activeProvider.key,
			settings: _.mapObject(recognitionProviderService.activeProvider.settingsAsMap, (setting) => {
				return setting.value;
			})
		};
	}
});

