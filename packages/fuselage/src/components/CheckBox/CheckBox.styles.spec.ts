import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { compile } from 'sass';

// Resolves webpack-style `~package/file` imports like the build's sass-loader does
const tildeImporter = {
	findFileUrl(url: string) {
		if (!url.startsWith('~')) {
			return null;
		}

		const [scope, name, ...file] = url.slice(1).split('/');
		const packageDir = path.dirname(require.resolve(`${scope}/${name}/package.json`));
		return new URL(pathToFileURL(path.join(packageDir, ...file)).href);
	},
};

const getSelectors = (css: string) =>
	Array.from(css.matchAll(/([^{}]+)\{/g), ([, selectorList]) => selectorList.split(',').map((selector) => selector.trim())).flat();

describe('[CheckBox styles]', () => {
	it('draws the dash, not the checkmark, when the input is both checked and indeterminate', () => {
		const { css } = compile(path.join(__dirname, 'CheckBox.styles.scss'), { importers: [tildeImporter] });

		const checkmarkSelectors = getSelectors(css).filter((selector) =>
			/\.rcx-check-box__input:checked[^+]*\+ \.rcx-check-box__fake::(before|after)/.test(selector),
		);

		expect(checkmarkSelectors).not.toHaveLength(0);
		checkmarkSelectors.forEach((selector) => expect(selector).toContain(':not(:indeterminate)'));
	});
});
