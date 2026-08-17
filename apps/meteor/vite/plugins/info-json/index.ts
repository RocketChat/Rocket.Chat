import fs from 'node:fs/promises';
import path from 'node:path';

import { makeIdFiltersToMatchWithQuery } from '@rolldown/pluginutils';
import type { Plugin } from 'vite';

const EXPECTED_KEYS: Record<string, string[]> = {
	'rocketchat-supported-versions.info': ['supportedVersions'],
};

/**
 * Meteor's build treated `.info` files as JSON modules with named exports.
 * Rolldown has no such handler, so load them here.
 *
 * The generated `rocketchat.info` is a virtual module owned by the `info`
 * plugin (which runs with `enforce: 'pre'`); this only picks up the real
 * `.info` files on disk, such as `rocketchat-supported-versions.info`.
 */
export default function infoJsonPlugin(): Plugin {
	return {
		name: 'rocketchat-info-json',
		load: {
			filter: {
				id: makeIdFiltersToMatchWithQuery(/\.info$/),
			},
			async handler(id) {
				const raw = await fs.readFile(id, 'utf-8');
				const parsed = JSON.parse(raw || '{}');

				const keys = new Set(Object.keys(parsed).filter((key) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)));

				// These files ship as empty placeholders and are filled in by the
				// release build. Under Meteor a missing key imported by name was
				// simply `undefined`; ESM makes it a hard build error, so declare
				// the known keys unconditionally to keep that behavior.
				for (const key of EXPECTED_KEYS[path.basename(id)] ?? []) {
					keys.add(key);
				}

				const namedExports = [...keys].map((key) => `export const ${key} = ${JSON.stringify(parsed[key])};`).join('\n');

				return `${namedExports}\nexport default ${JSON.stringify(parsed)};`;
			},
		},
	};
}
