import { withDebouncing } from '../../../../lib/utils/highOrderFunctions';
import { settings, settingsRegistry } from '../../../settings/server';
import { SearchLogger } from '../logger/logger';
import type { SearchProvider } from '../model/SearchProvider';

export class SearchProviderService {
	public providers: Record<string, SearchProvider> = {};

	public activeProvider?: SearchProvider;

	/**
	 * Stop current provider (if there is one) and start the new
	 * @param id the id of the provider which should be started
	 */
	async use(id: SearchProvider['key']) {
		if (!this.providers[id]) {
			throw new Error(`provider ${id} cannot be found`);
		}

		let reason: 'startup' | 'update' | 'switch';

		if (!this.activeProvider) {
			reason = 'startup';
		} else if (this.activeProvider.key === this.providers[id].key) {
			reason = 'update';
		} else {
			reason = 'switch';
		}

		if (this.activeProvider) {
			const provider = this.activeProvider;
			SearchLogger.debug(`Stopping provider '${provider.key}'`);

			await new Promise<void>((resolve) => provider.stop(resolve));
		}

		this.activeProvider = undefined;

		SearchLogger.debug(`Start provider '${id}'`);

		await this.providers[id].run(reason);
		this.activeProvider = this.providers[id];
	}

	/**
	 * Registers a search provider on system startup
	 */
	register(provider: SearchProvider) {
		this.providers[provider.key] = provider;
	}

	/**
	 * Starts the service (loads provider settings for admin ui, add lister not setting changes, enable current provider
	 */
	async start() {
		SearchLogger.debug('Load data for all providers');

		const { providers } = this;

		// add settings for admininistration
		await settingsRegistry.addGroup('Search', async function () {
			await this.add('Search.Provider', 'defaultProvider', {
				type: 'select',
				values: Object.values(providers).map((provider) => ({
					key: provider.key,
					i18nLabel: provider.i18nLabel,
				})),
				public: true,
				i18nLabel: 'Search_Provider',
			});

			await Promise.all(
				Object.keys(providers)
					.filter((key) => providers[key].settings && providers[key].settings.length > 0)
					.map(async (key) => {
						await this.section(providers[key].i18nLabel, async function () {
							await Promise.all(
								providers[key].settings.map(async (setting) => {
									const _options: Record<string, unknown> = {
										type: setting.type,
										...setting.options,
									};

									_options.enableQuery = _options.enableQuery || [];

									if (!_options.enableQuery) {
										_options.enableQuery = [];
									}

									if (Array.isArray(_options.enableQuery)) {
										_options.enableQuery.push({
											_id: 'Search.Provider',
											value: key,
										});
									}

									await this.add(setting.id, setting.defaultValue, _options);
								}),
							);
						});
					}),
			);
		});

		// add listener to react on setting changes
		const configProvider = withDebouncing({ wait: 1000 })(() => {
			const providerId = settings.get<string>('Search.Provider');

			if (providerId) {
				void this.use(providerId); // TODO do something with success and errors
			}
		});

		settings.watchByRegex(/^Search\./, configProvider);
	}
}
