// These PostCSS plugins ship without type declarations.
declare module 'postcss-easy-import' {
	import type { PluginCreator } from 'postcss';

	const plugin: PluginCreator<unknown>;
	export default plugin;
}

declare module 'postcss-media-minmax' {
	import type { PluginCreator } from 'postcss';

	const plugin: PluginCreator<unknown>;
	export default plugin;
}
