export default {
	testRunner: 'jest',
	plugins: ['@stryker-mutator/jest-runner', '@stryker-mutator/mocha-runner'],
	coverageAnalysis: 'perTest',
	concurrency: 2,
	// Meteor build output and asset directory symlinks are not needed by unit tests.
	ignorePatterns: [
		'reports/**',
		'coverage/**',
		'.meteor/local/**',
		'private/i18n',
		'private/moment-locales',
		'packages/rocketchat-i18n/i18n',
	],
	reporters: ['clear-text', 'progress', 'html', 'json'],
	thresholds: { break: 0 },
};
