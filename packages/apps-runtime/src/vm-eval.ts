import { createRequire } from 'node:module';
import vm from 'node:vm';

/**
 * Evaluate a CommonJS app bundle in a `node:vm` context (decision 0005 §5). The separate bundler
 * targets CJS, so we inject `module`/`exports`/`require` and read `module.exports`.
 *
 * Slice 1 is deliberately PERMISSIVE — real globals, a real `require`. `node:vm` is the *seam*
 * where the capability cage (controlled module graph, denied ambient builtins, runtime-controlled
 * SDK objects) attaches in a later isolation iteration (0005 §7). It is used now precisely so we
 * execute through the mechanism we will later tighten, instead of through `import()`.
 *
 * `require` is created from THIS module's location so a bare `@rocket.chat/apps-sdk` specifier in
 * the bundle resolves to the *same* module instance the worker loaded — which is what makes the
 * brand identity-check work across the vm boundary (0005 §5).
 */
const requireFromRuntime = createRequire(__filename);

export function evalCjsBundle(code: string, filename: string): unknown {
	const module: { exports: Record<string, unknown> } = { exports: {} };

	const sandbox: Record<string, unknown> = {
		module,
		exports: module.exports,
		require: requireFromRuntime,
		console,
		process,
		Buffer,
		setTimeout,
		clearTimeout,
		setInterval,
		clearInterval,
		URL,
		URLSearchParams,
		TextEncoder,
		TextDecoder,
	};
	sandbox.global = sandbox;
	sandbox.globalThis = sandbox;

	const context = vm.createContext(sandbox);
	vm.runInContext(code, context, { filename });

	return module.exports;
}
