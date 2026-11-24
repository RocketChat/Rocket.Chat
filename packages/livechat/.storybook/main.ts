import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve, sep } from 'node:path';

import type { StorybookConfig } from '@storybook/preact-vite';
import { mergeConfig, type Plugin } from 'vite';

const require = createRequire(import.meta.url);

const getAbsolutePath = (value: string): string => dirname(require.resolve(join(value, 'package.json')));

const packageRoot = resolve(import.meta.dirname, '..');

/** Compiles the Sass files under `src/components` and `src/routes` as CSS modules, as the production build does, although they aren't named `*.module.scss`. */
const scssModules = (): Plugin => {
	const moduleRoots = [join(packageRoot, 'src', 'components'), join(packageRoot, 'src', 'routes')].map((root) => `${root}${sep}`);

	return {
		name: 'livechat:scss-modules',
		enforce: 'pre',
		async resolveId(source, importer, options) {
			if (!source.endsWith('.scss')) {
				return null;
			}

			const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });

			if (!resolved || !moduleRoots.some((root) => resolved.id.startsWith(root))) {
				return resolved;
			}

			return { ...resolved, id: `${resolved.id}?livechat.module.scss` };
		},
	};
};

/** Renders imported SVG files as Preact components, the way the production build does. */
const svgComponents = (): Plugin => {
	const prefix = '\0livechat-svg:';

	return {
		name: 'livechat:svg-components',
		enforce: 'pre',
		async resolveId(source, importer, options) {
			if (!source.endsWith('.svg')) {
				return null;
			}

			const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
			return resolved && `${prefix}${resolved.id}`;
		},
		load(id) {
			if (!id.startsWith(prefix)) {
				return null;
			}

			const source = readFileSync(id.slice(prefix.length), 'utf8');
			const [, rawAttributes = '', rawContent = ''] = /<svg([^>]+)>([\s\S]+)<\/svg>/i.exec(source) ?? [];
			const attributes = Object.fromEntries(
				[...rawAttributes.matchAll(/([\w:-]+)(?:=("[^<>"]*"|'[^<>']*'|[\w:-]+))?/g)].map(([, name, value]) => [
					name,
					value ? value.replace(/['"]/g, '') : true,
				]),
			);
			const content = rawContent.replace(/\n/g, ' ').trim();

			return `
				import { h } from 'preact';

				const attributes = ${JSON.stringify(attributes)};
				const content = ${JSON.stringify(content)};

				export default function SvgComponent(props) {
					return h('svg', { ...attributes, ...props, dangerouslySetInnerHTML: { __html: content } });
				}
			`;
		},
	};
};

/** Swaps the UiKit action dispatcher for a mock that reports actions to the Actions panel. */
const uiKitMock = (): Plugin => {
	const uiKitPath = join(packageRoot, 'src', 'lib', 'uiKit.ts');
	const mockPath = join(import.meta.dirname, 'mocks', 'uiKit.ts');

	return {
		name: 'livechat:uikit-mock',
		enforce: 'pre',
		async resolveId(source, importer, options) {
			if (!source.endsWith('/uiKit') || importer === mockPath) {
				return null;
			}

			const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
			return resolved?.id === uiKitPath ? mockPath : resolved;
		},
	};
};

/** Lets the date-fns locale picked at runtime be loaded, which Vite can't do from a bare specifier built from a variable. */
const dateFnsLocales = (): Plugin => {
	const localeFile = join(packageRoot, 'src', 'lib', 'locale.ts');
	const localeDir = relative(dirname(localeFile), join(getAbsolutePath('date-fns'), 'locale'))
		.split(sep)
		.join('/');
	const dynamicImport = 'import(`date-fns/locale/${locale}.js`)';

	return {
		name: 'livechat:date-fns-locales',
		transform(code, id) {
			if (id !== localeFile) {
				return null;
			}

			if (!code.includes(dynamicImport)) {
				this.error(`Expected ${localeFile} to load date-fns locales with ${dynamicImport}`);
			}

			return code.replace(dynamicImport, `import.meta.glob('${localeDir}/*.js')[\`${localeDir}/\${locale}.js\`]()`);
		},
	};
};

const config: StorybookConfig = {
	stories: ['../src/**/{*.story,story,*.stories,stories}.tsx'],

	addons: [getAbsolutePath('@storybook/addon-docs'), require.resolve('@rocket.chat/storybook-config/preset')],

	framework: {
		name: getAbsolutePath('@storybook/preact-vite'),
		options: {},
	},

	viteFinal: (viteConfig) =>
		mergeConfig(viteConfig, {
			plugins: [scssModules(), svgComponents(), uiKitMock(), dateFnsLocales()],
			oxc: {
				jsx: {
					runtime: 'automatic',
					importSource: 'preact',
				},
			},
			resolve: {
				alias: [
					{ find: /^react$/, replacement: 'preact/compat' },
					{ find: /^react-dom$/, replacement: 'preact/compat' },
					{ find: /^react-dom\/client$/, replacement: 'preact/compat/client' },
					{ find: /^react-dom\/test-utils$/, replacement: 'preact/test-utils' },
					{ find: /^react\/jsx-runtime$/, replacement: 'preact/jsx-runtime' },
					{ find: /^react\/jsx-dev-runtime$/, replacement: 'preact/jsx-dev-runtime' },
				],
			},
			css: {
				modules: {
					generateScopedName: '[local]__[hash:base64:5]',
				},
			},
			optimizeDeps: {
				// Vite serves linked workspace packages as they are, and these ship CommonJS, whose named exports only
				// pre-bundling exposes to the browser.
				include: ['@rocket.chat/core-typings', '@rocket.chat/ddp-client'],
			},
		}),
};

export default config;
