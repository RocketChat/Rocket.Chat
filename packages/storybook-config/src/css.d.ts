// TS7 errors on side-effect imports of `.css` (TS2882) without a declaration.
declare module '*.css' {
	export = undefined;
}
