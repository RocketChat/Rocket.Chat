module.exports = {
  addons: [
		{
			name: '@storybook/addon-essentials',
			options: {
				backgrounds: false,
			}
		},
		'@storybook/addon-knobs',
  ],
  stories: [
		'../src/**/stories.js',
		'../src/**/story.js',
		'../src/**/*.stories.js',
		'../src/**/*.story.js',
  ],
};
