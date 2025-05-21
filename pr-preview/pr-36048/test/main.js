var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { dirname, join, resolve } from 'path';
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
    docs: {},
    webpackFinal: (config) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        // This is only needed because of Fontello
        config.resolve = Object.assign(Object.assign({}, config.resolve), { roots: [...((_b = (_a = config.resolve) === null || _a === void 0 ? void 0 : _a.roots) !== null && _b !== void 0 ? _b : []), resolve(__dirname, '../../../apps/meteor/public')] });
        return config;
    }),
};
export default config;
//# sourceMappingURL=main.js.map