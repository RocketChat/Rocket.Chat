module.exports = {
	addons: [
		{
			name: '@storybook/addon-essentials',
			options: {
				backgrounds: false,
			},
		},
		'@storybook/addon-postcss',
	],
	stories: ['../src/**/stories.{js,tsx}', '../src/**/story.{js,tsx}', '../src/**/*.stories.{js,tsx}', '../src/**/*.story.{js,tsx}'],
};
