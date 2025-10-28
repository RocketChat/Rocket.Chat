import { settingsRegistry } from '../../app/settings/server';

export const createAnalyticsSettings = () =>
	settingsRegistry.addGroup('Analytics', async function addSettings() {
		await this.section('Piwik', async function () {
			const enableQuery = { _id: 'PiwikAnalytics_enabled', value: true };
			await this.add('PiwikAnalytics_enabled', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Enable',
			});
			await this.add('PiwikAnalytics_url', '', {
				type: 'string',
				public: true,
				i18nLabel: 'URL',
				enableQuery,
			});
			await this.add('PiwikAnalytics_siteId', '', {
				type: 'string',
				public: true,
				i18nLabel: 'Client_ID',
				enableQuery,
			});
			await this.add('PiwikAdditionalTrackers', '', {
				type: 'string',
				multiline: true,
				public: true,
				i18nLabel: 'PiwikAdditionalTrackers',
				enableQuery,
			});
			await this.add('PiwikAnalytics_prependDomain', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'PiwikAnalytics_prependDomain',
				enableQuery,
			});
			await this.add('PiwikAnalytics_cookieDomain', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'PiwikAnalytics_cookieDomain',
				enableQuery,
			});
			await this.add('PiwikAnalytics_domains', '', {
				type: 'string',
				multiline: true,
				public: true,
				i18nLabel: 'PiwikAnalytics_domains',
				enableQuery,
			});
		});

		await this.section('Analytics_Google', async function () {
			const enableQuery = { _id: 'GoogleAnalytics_enabled', value: true };
			await this.add('GoogleAnalytics_enabled', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Enable',
			});

			await this.add('GoogleAnalytics_ID', '', {
				type: 'string',
				public: true,
				i18nLabel: 'Analytics_Google_id',
				enableQuery,
			});
		});

		await this.section('Analytics_features_enabled', async function addFeaturesEnabledSettings() {
			await this.add('Analytics_features_messages', true, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Messages',
				i18nDescription: 'Analytics_features_messages_Description',
			});
			await this.add('Analytics_features_rooms', true, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Rooms',
				i18nDescription: 'Analytics_features_rooms_Description',
			});
			await this.add('Analytics_features_users', true, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Users',
				i18nDescription: 'Analytics_features_users_Description',
			});
			await this.add('Engagement_Dashboard_Load_Count', 0, {
				type: 'int',
				hidden: true,
			});
		});
	});
