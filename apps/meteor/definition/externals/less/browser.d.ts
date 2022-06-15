declare module 'less/browser' {
	function createLess(window: Window, options: Less.Options): LessStatic;

	export = createLess;
}
