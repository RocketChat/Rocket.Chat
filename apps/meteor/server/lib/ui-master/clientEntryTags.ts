import { escapeHTML } from '@rocket.chat/tools';

export type ViteManifestChunk = {
	file: string;
	css?: string[];
	imports?: string[];
	isEntry?: boolean;
};

export type ViteManifest = Record<string, ViteManifestChunk>;

/**
 * The tags that load the Vite-built client: the stylesheets and chunks it needs up front, then its entry.
 * Every URL starts with `prefix`, the CDN or path prefix the server serves the bundle under.
 */
export const getClientEntryTags = (manifest: ViteManifest, prefix: string): string => {
	const entry = Object.values(manifest).find((chunk) => chunk.isEntry);
	if (!entry) {
		return '';
	}

	const url = (file: string) => escapeHTML(`${prefix.replace(/\/$/, '')}/${file}`);

	const preloads = new Set<string>();
	const stylesheets = new Set<string>();
	const visited = new Set<string>();

	const collect = (chunk: ViteManifestChunk) => {
		for (const key of chunk.imports ?? []) {
			const imported = manifest[key];
			if (!imported || visited.has(key)) {
				continue;
			}
			visited.add(key);
			collect(imported);
			preloads.add(imported.file);
		}
		chunk.css?.forEach((file) => stylesheets.add(file));
	};

	collect(entry);

	return [
		...[...stylesheets].map((file) => `<link rel="stylesheet" crossorigin href="${url(file)}">`),
		...[...preloads].map((file) => `<link rel="modulepreload" crossorigin href="${url(file)}">`),
		`<script type="module" crossorigin src="${url(entry.file)}"></script>`,
	].join('\n');
};
