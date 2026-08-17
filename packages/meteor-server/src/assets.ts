import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Port of Meteor's server-side `Assets` global, which reads files bundled from
 * the app's `private/` directory.
 *
 * Meteor exposes `Assets` as a bare global rather than an importable module, so
 * importing this file installs it on `globalThis`.
 *
 * The asset root defaults to `<cwd>/private`; set `METEOR_ASSETS_DIR` when the
 * built server does not run from the app directory.
 */

const assetsRoot = () => process.env.METEOR_ASSETS_DIR ?? path.resolve(process.cwd(), 'private');

const resolveAsset = (assetPath: string): string => {
	const root = assetsRoot();
	const resolved = path.resolve(root, assetPath);

	// Meteor scopes asset reads to the app's private directory
	if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
		throw new Error(`Assets: path escapes the assets directory: ${assetPath}`);
	}

	return resolved;
};

export const Assets = {
	absoluteFilePath(assetPath: string): string {
		return resolveAsset(assetPath);
	},

	async getTextAsync(assetPath: string): Promise<string> {
		return fs.readFile(resolveAsset(assetPath), 'utf-8');
	},

	async getBinaryAsync(assetPath: string): Promise<Buffer> {
		return fs.readFile(resolveAsset(assetPath));
	},
};

declare global {
	// eslint-disable-next-line no-var
	var Assets: typeof import('./assets.ts').Assets;
}

globalThis.Assets ??= Assets;
