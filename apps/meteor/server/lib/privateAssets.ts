import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Absolute path of a file from the app's `private/` directory. Throws when the path leads outside it.
 *
 * Meteor bundles files with identical content once, so of two identical files in `private/` only the first can be read.
 */
export function resolvePrivateAsset(relativePath: string): string {
	// Meteor copies `private/` to `programs/server/assets/app` and starts the server from `programs/server`.
	const root = path.join(process.cwd(), 'assets', 'app');
	const resolved = path.resolve(root, relativePath);

	if (!resolved.startsWith(`${root}${path.sep}`)) {
		throw new Error(`Private asset path leads outside private/: ${relativePath}`);
	}

	return resolved;
}

export function readPrivateAsset(relativePath: string): Promise<Buffer> {
	return readFile(resolvePrivateAsset(relativePath));
}

export function readPrivateAssetText(relativePath: string): Promise<string> {
	return readFile(resolvePrivateAsset(relativePath), 'utf8');
}
