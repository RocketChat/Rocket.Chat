import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
	// TODO: get from settings
	applicationId: '20da162f-60cc-45b6-8c43-9f1e75606ec8',
	// TODO: get from settings
	clientToken: 'pub06b410d062e232ce0b3faa893755663a',
	site: 'datadoghq.com',
	// TODO: get from settings
	service: 'localhost',
	env: 'development',
	// Specify a version number to identify the deployed version of your application in Datadog
	// TODO: get from conf
	version: '6.5.0',
	sessionSampleRate: 100,
	sessionReplaySampleRate: 20,
	trackUserInteractions: true,
	trackResources: true,
	trackLongTasks: true,
	defaultPrivacyLevel: 'mask-user-input',
});
