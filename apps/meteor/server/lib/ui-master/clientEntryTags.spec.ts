import type { ViteManifest } from './clientEntryTags';
import { getClientEntryTags } from './clientEntryTags';

const manifest: ViteManifest = {
	'index.html': {
		file: 'bundle/index-abc.js',
		isEntry: true,
		css: ['bundle/index-abc.css'],
		imports: ['_react.js', '_lib.js'],
	},
	'_react.js': { file: 'bundle/react-def.js' },
	'_lib.js': { file: 'bundle/lib-ghi.js', css: ['bundle/lib-ghi.css'], imports: ['_react.js', '_util.js'] },
	'_util.js': { file: 'bundle/util-jkl.js' },
	'client/views/admin/index.ts': { file: 'bundle/admin-mno.js', css: ['bundle/admin-mno.css'] },
};

describe('getClientEntryTags', () => {
	it('loads the stylesheets of the entry and every chunk it imports, then preloads those chunks and runs the entry', () => {
		expect(getClientEntryTags(manifest, '').split('\n')).toEqual([
			'<link rel="stylesheet" crossorigin href="/bundle/lib-ghi.css">',
			'<link rel="stylesheet" crossorigin href="/bundle/index-abc.css">',
			'<link rel="modulepreload" crossorigin href="/bundle/react-def.js">',
			'<link rel="modulepreload" crossorigin href="/bundle/util-jkl.js">',
			'<link rel="modulepreload" crossorigin href="/bundle/lib-ghi.js">',
			'<script type="module" crossorigin src="/bundle/index-abc.js"></script>',
		]);
	});

	it('leaves the chunks only loaded on demand out', () => {
		expect(getClientEntryTags(manifest, '')).not.toContain('admin-mno');
	});

	it.each([
		['a path prefix', '/chat', '/chat/bundle/'],
		['a CDN', 'https://cdn.example.com/', 'https://cdn.example.com/bundle/'],
	])('serves every file under %s', (_name, prefix, bundleUrl) => {
		const tags = getClientEntryTags(manifest, prefix).split('\n');
		expect(tags).toHaveLength(6);
		tags.forEach((tag) => expect(tag).toContain(`"${bundleUrl}`));
	});

	it('escapes the prefix', () => {
		expect(getClientEntryTags(manifest, 'https://cdn.example.com/"><x')).toContain(
			'src="https://cdn.example.com/&quot;&gt;&lt;x/bundle/index-abc.js"',
		);
	});

	it('renders nothing for a manifest without an entry', () => {
		expect(getClientEntryTags({ '_react.js': { file: 'bundle/react-def.js' } }, '')).toBe('');
	});
});
