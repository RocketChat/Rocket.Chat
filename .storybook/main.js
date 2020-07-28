module.exports = {
	stories: [
		'../app/**/*.stories.js',
		'../client/**/*.stories.js',
		'../ee/app/**/*.stories.js',
	],
	addons: [
		'@storybook/addon-actions',
		'@storybook/addon-knobs',
		'@storybook/addon-viewport',
	],
};
