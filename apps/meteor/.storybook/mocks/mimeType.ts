/**
 * Stands in for `mime-type/with-db` in stories.
 *
 * Any story that renders the message composer reaches `lib/mimeTypes`, which loads the full MIME
 * database. That package's own dependencies — `micromatch` and `path.js` — are written for Node: they read
 * `process.platform` and `require('path')` at module scope. Meteor's bundler shims Node's built-ins, webpack 5
 * does not, so a story that got there rendered `process is not defined` instead of the component.
 *
 * Replaced here rather than shimmed globally: the database is what a story doesn't need, and the alternative —
 * teaching webpack to fake `process` and `path` for the whole preview — pulls Node's shape into every story to
 * satisfy one dependency of one module. The same reason `meteor` and the server tree are replaced above it.
 *
 * `lib/mimeTypes` keeps its own logic: only the lookup table below is stubbed, with the types a
 * story is plausibly built around — including the ones that module registers itself through `define`, since the
 * `define` here accepts the call and drops it.
 */
const types: Record<string, string> = {
	// `aac` and `ico` are `lib/mimeTypes`' own registrations. Its last `define` for `ico` overwrites,
	// so `image/x-icon` is the one that wins there and the one that belongs here.
	aac: 'audio/aac',
	csv: 'text/csv',
	gif: 'image/gif',
	ico: 'image/x-icon',
	jpeg: 'image/jpeg',
	jpg: 'image/jpeg',
	json: 'application/json',
	mp3: 'audio/mpeg',
	mp4: 'video/mp4',
	pdf: 'application/pdf',
	png: 'image/png',
	svg: 'image/svg+xml',
	txt: 'text/plain',
	wav: 'audio/wav',
	webm: 'video/webm',
	webp: 'image/webp',
	zip: 'application/zip',
};

const extensionFor = (mimeType: string): string | false => Object.keys(types).find((extension) => types[extension] === mimeType) ?? false;

const mime = {
	types,

	/** The real one takes a duplicate-handling mode; nothing here needs one, so the call is accepted and dropped. */
	define: (): void => undefined,
	dupAppend: 'append',
	dupOverwrite: 'overwrite',

	/** `false` where the real one finds nothing, which is what the callers already branch on. */
	extension: (mimeType: string): string | false => extensionFor(mimeType),

	lookup: (fileName: string): string | false => {
		const extension = fileName.split('.').pop()?.toLowerCase();

		return (extension && types[extension]) || false;
	},
};

export default mime;
