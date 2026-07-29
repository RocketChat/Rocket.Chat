import vm from 'node:vm';

/**
 * Validate the syntax of a user-supplied integration script and return it
 * as-is for storage in `scriptCompiled`.
 *
 * Integration scripts run inside `isolated-vm`, which embeds modern V8 and
 * handles ES2023+ natively. Transpilation via Babel is no longer performed.
 *
 * ⚠️  **Breaking change (9.0.0):** Class method bodies are now in strict
 * mode per the ES2015 spec. Scripts that relied on sloppy-mode behaviors
 * (e.g. implicit globals, `arguments.callee`, `this === globalThis` inside
 * regular nested functions) must be updated. See the migration guide in the
 * PR description.
 *
 * Returns `{ script }` on success or `{ error }` when the input has a
 * syntax error. `error` has the same `{ name, message, stack }` shape the
 * previous flow persisted in `scriptError`.
 */
export function validateScriptSyntax(
	script: string,
): { script: string; error?: undefined } | { script?: undefined; error: Pick<Error, 'name' | 'message' | 'stack'> } {
	try {
		// Wrap so top-level return/declarations parse the same way as in
		// getCompatibilityScript at runtime. vm.Script only parses — it does
		// not execute the code here.
		// eslint-disable-next-line no-new
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
