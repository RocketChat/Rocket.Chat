import vm from 'node:vm';

import { transformSync } from '@babel/core';
import presetEnv from '@babel/preset-env';

/**
 * Compile or validate a user-supplied integration script for storage in
 * `scriptCompiled`.
 *
 * When `transpile` is `true` (the default, controlled by each integration's
 * `skipTranspile` flag), the script is transpiled with `@babel/core +
 * @babel/preset-env` — the historical behavior. When `false`, the script is
 * validated with Node's built-in `vm.Script` and stored as-is, matching the
 * 9.0.0 default where Babel transpilation is removed entirely.
 *
 * Integration scripts run inside `isolated-vm`, which embeds modern V8 and
 * handles ES2023+ natively. The transpilation only exists to preserve the
 * sloppy-mode semantics (implicit globals in class methods, `this` in nested
 * functions, etc.) that early scripts relied on. Admins can flip
 * `skipTranspile: true` per integration to test strict-mode compatibility
 * before the 9.0.0 upgrade.
 *
 * Returns `{ script }` on success or `{ error }` with the same
 * `{ name, message, stack }` shape persisted in `scriptError`.
 */
export function compileIntegrationScript(
	script: string,
	{ transpile }: { transpile: boolean },
): { script: string; error?: undefined } | { script?: undefined; error: Pick<Error, 'name' | 'message' | 'stack'> } {
	if (!transpile) {
		return validateOnly(script);
	}

	return transpileWithBabel(script);
}

function validateOnly(
	script: string,
): { script: string; error?: undefined } | { script?: undefined; error: Pick<Error, 'name' | 'message' | 'stack'> } {
	try {
		new vm.Script(`(function(){${script}})`);
		return { script };
	} catch (e) {
		if (e instanceof SyntaxError) {
			const { name, message, stack } = e;
			return { error: { name, message, stack } };
		}
		throw e;
	}
}

function transpileWithBabel(
	script: string,
): { script: string; error?: undefined } | { script?: undefined; error: Pick<Error, 'name' | 'message' | 'stack'> } {
	try {
		const result = transformSync(script, {
			presets: [presetEnv],
			compact: true,
			minified: true,
			comments: false,
		});

		return { script: result?.code ?? script };
	} catch (e) {
		if (e instanceof Error) {
			const { name, message, stack } = e;
			return { error: { name, message, stack } };
		}
		throw e;
	}
}
