module.exports = {
	stories: [
		'../app/**/ContextualBarMessage.stories.js',
		'../app/**/ThreadsList.stories.js',
		// '../client/**/*.stories.js',
		// '../ee/app/**/*.stories.js',
	],
	addons: [
		'@storybook/addon-actions',
		'@storybook/addon-knobs',
	],
};
