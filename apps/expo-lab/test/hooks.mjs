// apps/meteor declares "type": "commonjs" but its client sources are ES modules (Meteor's bundler and Metro read them as such),
// so a pure client file the app imports is loaded as a module here too
export async function load(url, context, nextLoad) {
	if (url.includes('/apps/meteor/client/') && url.endsWith('.ts')) return nextLoad(url, { ...context, format: 'module-typescript' });
	return nextLoad(url, context);
}
