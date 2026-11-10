// Builds the web client the server serves and reports its size: JS and CSS totals (raw and gzip), and the rendered
// bytes of every module from Fuselage's sources and from `@tamagui/*`, and the gzip size of every chunk.
//
//   node vite/sizeReport.mjs                        print the report
//   node vite/sizeReport.mjs --json out.json        also write it as JSON
//   node vite/sizeReport.mjs --compare base.json    print the change against a report written with --json
//   node vite/sizeReport.mjs --compare base.json --markdown out.md   also write the comparison as a Markdown table
//   node vite/sizeReport.mjs --report pr.json --compare base.json    compare a report written earlier, without building
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { gzipSync } from 'node:zlib';

import { build } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(here, '../../..');
const dist = join(here, 'dist');

const { values: args } = parseArgs({
	options: { json: { type: 'string' }, compare: { type: 'string' }, markdown: { type: 'string' }, report: { type: 'string' } },
});

const toPosix = (path) => path.replaceAll('\\', '/');
const fuselageSrc = toPosix(join(workspaceRoot, 'packages/fuselage/src/'));

const tracked = (id) => {
	const file = toPosix(id.split('?')[0]);
	if (file.includes('/node_modules/@tamagui/')) return `@tamagui/${file.split('/node_modules/@tamagui/')[1]}`;
	if (file.startsWith(fuselageSrc)) return toPosix(relative(workspaceRoot, file));
	return undefined;
};

const modules = {};
const chunks = {};
const totals = { js: { bytes: 0, gzip: 0 }, css: { bytes: 0, gzip: 0 } };
// Chunk files carry a content hash, which would make every chunk look new in a comparison.
const chunkName = (file) => file.replace(/-[\w-]{8}(?=\.(?:js|css)$)/, '');
const count = (kind, content, file) => {
	const size = { bytes: Buffer.byteLength(content), gzip: gzipSync(content).length };
	totals[kind].bytes += size.bytes;
	totals[kind].gzip += size.gzip;
	chunks[chunkName(file)] = size;
};
if (args.report) {
	const loaded = JSON.parse(readFileSync(args.report, 'utf8'));
	Object.assign(totals, loaded.totals);
	Object.assign(chunks, loaded.chunks);
	Object.assign(modules, loaded.modules);
} else {
	process.env.RC_CLIENT_TARGET = 'server';
	await build({
		configFile: join(here, 'vite.config.mts'),
		logLevel: 'warn',
		plugins: [
			{
				name: 'rocketchat-size-report',
				generateBundle(_options, bundle) {
					// Counted from the output itself: `dist/bundle` also receives whatever `public/bundle` holds.
					for (const chunk of Object.values(bundle)) {
						if (chunk.type === 'asset' && chunk.fileName.endsWith('.css')) count('css', chunk.source, chunk.fileName);
						if (chunk.type !== 'chunk') continue;
						count('js', chunk.code, chunk.fileName);
						for (const [id, rendered] of Object.entries(chunk.modules)) {
							const name = tracked(id);
							if (!name || !rendered.code) continue;
							modules[name] = {
								bytes: (modules[name]?.bytes ?? 0) + Buffer.byteLength(rendered.code),
								gzip: (modules[name]?.gzip ?? 0) + gzipSync(rendered.code).length,
							};
						}
					}
				},
			},
		],
	});

	// Tamagui's zero-runtime stylesheet joins the bundle once it is closed, so it is not among the assets counted above.
	const manifest = JSON.parse(readFileSync(join(dist, '.vite/manifest.json'), 'utf8'));
	const entry = Object.values(manifest).find((chunk) => chunk.isEntry);
	for (const file of entry.css.filter((css) => css.includes('tamagui-zero-'))) count('css', readFileSync(join(dist, file)), file);
}

const sum = (filter) =>
	Object.entries(modules)
		.filter(([name]) => filter(name))
		.reduce((acc, [, size]) => ({ bytes: acc.bytes + size.bytes, gzip: acc.gzip + size.gzip }), { bytes: 0, gzip: 0 });
const report = {
	totals,
	fuselageSrc: sum((name) => name.startsWith('packages/fuselage/src/')),
	tamagui: sum((name) => name.startsWith('@tamagui/')),
	chunks,
	modules,
};

const kB = (bytes) => `${(bytes / 1000).toFixed(1)} kB`;
const signed = (bytes) => `${bytes >= 0 ? '+' : ''}${kB(bytes)}`;
const base = args.compare ? JSON.parse(readFileSync(args.compare, 'utf8')) : undefined;
const line = (label, size, before) =>
	console.log(
		`${kB(size.bytes).padStart(10)} ${kB(size.gzip).padStart(10)} gzip${
			before ? `  ${signed(size.bytes - before.bytes).padStart(10)} ${signed(size.gzip - before.gzip).padStart(10)} gzip` : ''
		}  ${label}`,
	);

line('JS', totals.js, base?.totals.js);
line('CSS', totals.css, base?.totals.css);
line('packages/fuselage/src', report.fuselageSrc, base?.fuselageSrc);
line('@tamagui/*', report.tamagui, base?.tamagui);

// Module gzip sizes are each compressed alone, so they overstate their share of the chunk's gzip.
const changed = Object.keys({ ...modules, ...base?.modules })
	.map((name) => ({ name, size: modules[name] ?? { bytes: 0, gzip: 0 }, before: base?.modules[name] ?? { bytes: 0, gzip: 0 } }))
	.filter(({ size, before }) => !base || size.bytes !== before.bytes)
	.sort((a, b) => Math.abs(b.size.bytes - b.before.bytes) - Math.abs(a.size.bytes - a.before.bytes));
console.log(`\n${base ? 'Changed modules' : 'Largest modules'}:`);
for (const { name, size, before } of changed.slice(0, 40)) line(name, size, base && before);

const changedChunks = Object.keys({ ...chunks, ...base?.chunks })
	.map((name) => ({ name, size: chunks[name] ?? { bytes: 0, gzip: 0 }, before: base?.chunks?.[name] ?? { bytes: 0, gzip: 0 } }))
	.filter(({ size, before }) => size.gzip !== before.gzip)
	.sort((a, b) => Math.abs(b.size.gzip - b.before.gzip) - Math.abs(a.size.gzip - a.before.gzip));
if (base) {
	console.log('\nChanged chunks:');
	for (const { name, size, before } of changedChunks.slice(0, 40)) line(name, size, before);
}

if (args.markdown && base) {
	const row = (label, size, before) =>
		`| ${label} | ${kB(size.gzip)} | ${signed(size.gzip - before.gzip)} | ${kB(size.bytes)} | ${signed(size.bytes - before.bytes)} |`;
	writeFileSync(
		args.markdown,
		[
			'| | gzip | gzip change | raw | raw change |',
			'| --- | ---: | ---: | ---: | ---: |',
			row('JS', totals.js, base.totals.js),
			row('CSS', totals.css, base.totals.css),
			'',
			'<details><summary>Changed chunks (gzip)</summary>',
			'',
			'| chunk | gzip | gzip change |',
			'| --- | ---: | ---: |',
			...changedChunks.slice(0, 40).map(({ name, size, before }) => `| ${name} | ${kB(size.gzip)} | ${signed(size.gzip - before.gzip)} |`),
			'',
			'</details>',
			'',
		].join('\n'),
	);
}

if (args.json) writeFileSync(args.json, `${JSON.stringify(report, null, 2)}\n`);
