import { dirname, join } from 'path';
function getAbsolutePath(value) {
    return dirname(require.resolve(join(value, 'package.json')));
}
export const config = {
    stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: [
        getAbsolutePath('@storybook/addon-a11y'),
        getAbsolutePath('@storybook/addon-essentials'),
        getAbsolutePath('storybook-dark-mode'),
        getAbsolutePath('@storybook/addon-webpack5-compiler-babel'),
        getAbsolutePath('@storybook/addon-styling-webpack'),
    ],
    framework: {
        name: getAbsolutePath('@storybook/react-webpack5'),
        options: {},
    },
    typescript: {
        reactDocgen: 'react-docgen',
    },
};
export default config;
//# sourceMappingURL=main.js.map