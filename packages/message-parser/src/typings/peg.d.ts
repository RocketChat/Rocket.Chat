declare module '*.pegjs' {
	import type { ParserOptions } from 'peggy';

	export const parse: (input: string, options?: ParserOptions) => import('../definitions').Root;
}
