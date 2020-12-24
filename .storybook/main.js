module.exports = {
	stories: [
		'../app/**/*.stories.js',
		'../client/**/*.stories.js',
		'../ee/**/*.stories.js',
	],
	addons: [
		'@storybook/addon-actions',
		'@storybook/addon-docs',
		'@storybook/addon-controls',
		'@storybook/addon-viewport',
	],
};
