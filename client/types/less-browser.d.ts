declare function createLess(window: Window, options: Less.Options): LessStatic;

declare module 'less/browser' {
	export = createLess;
}
