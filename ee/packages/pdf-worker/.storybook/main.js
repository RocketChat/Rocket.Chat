module.exports = {
	stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
	addons: ['@storybook/addon-essentials'],
	framework: '@storybook/react',
	staticDirs: ['../src/public'],
	features: {
		postcss: false,
	},
	typescript: {
		reactDocgen: 'react-docgen-typescript-plugin',
	},
};
