import type { Plugin } from 'vite';

const extRE = /\.[tj]sx?$/;
const clientRE = /[\\/]apps[\\/]meteor[\\/]client[\\/]/;

export function reactCompilerPlugin(): Plugin {
	let oxc: typeof import('oxc-transform-react') | undefined;

	return {
		name: 'vite:react-compiler-oxc',
		enforce: 'pre',
		async buildStart() {
			oxc = await import('oxc-transform-react');
		},
		transform: {
			filter: { id: extRE },
			async handler(code, id) {
				if (!oxc) return;
				if (!clientRE.test(id)) return;

				const lang = id.endsWith('.tsx') ? 'tsx' : id.endsWith('.ts') ? 'ts' : id.endsWith('.jsx') ? 'jsx' : 'js';
				const result = oxc.transformSync(id, code, {
					lang,
					sourceType: 'module',
					sourcemap: true,
					jsx: 'preserve',
					reactCompiler: { panicThreshold: 'none', compilationMode: 'infer' },
				});

				if (result.fatal || !result.code) return;
				return { code: result.code, map: result.map ?? null };
			},
		},
	};
}
