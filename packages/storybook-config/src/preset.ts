import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Options } from 'storybook/internal/types';

const require = createRequire(import.meta.url);

/** Dresses a Storybook in the Fuselage theme picked from the toolbar, branded with the name of the package it documents. */
export const managerEntries = (entries: string[] = []): string[] => [...entries, fileURLToPath(import.meta.resolve('./manager.js'))];

export const previewAnnotations = (entries: string[] = []): string[] => [...entries, fileURLToPath(import.meta.resolve('./globals.js'))];

export const env = (config: Record<string, string> = {}, { configDir }: Options): Record<string, string> => ({
	...config,
	STORYBOOK_PACKAGE_NAME: JSON.parse(readFileSync(join(configDir, '..', 'package.json'), 'utf8')).name,
});

const fuselageFontsDir = dirname(require.resolve('@rocket.chat/fuselage/dist/fonts/InterVariable.woff2'));

const translationsDir = dirname(require.resolve('@rocket.chat/i18n/dist/resources/en.i18n.json'));

export const staticDirs = (dirs: { from: string; to: string }[] = []) => [
	...dirs,
	{ from: fuselageFontsDir, to: '/fuselage-fonts' },
	{ from: translationsDir, to: '/i18n' },
];

export const managerHead = (head = ''): string => `${head}
	<style>
		@font-face {
			font-family: 'Inter';
			font-weight: 100 900;
			font-style: normal;
			font-display: swap;
			src: url('./fuselage-fonts/InterVariable.woff2') format('woff2');
		}
	</style>`;
