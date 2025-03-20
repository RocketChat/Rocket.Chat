declare module 'less/lib/less-browser' {
	function createLess(window: Window, options: Less.Options): LessStatic;

	export = createLess;
}
