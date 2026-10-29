import { createHash } from 'node:crypto';

import { Autoupdate } from 'meteor/autoupdate';
import { Meteor } from 'meteor/meteor';

import type { ViteManifest } from './clientEntryTags';
import { getClientEntryTags } from './clientEntryTags';
import { injectIntoHead } from './inject';
import { settings } from '../../settings';
import { SystemLogger } from '../logger/system';
import { readPrivateAssetText } from '../privateAssets';

// The web client is built by Vite into `public/bundle`; the page the server renders loads it through these tags.
const MANIFEST = 'vite-manifest.json';

// The bundle gets the prefix Meteor gives the JS and CSS of its own bundle.
const getBundlePrefix = (): string => {
	const cdnPrefix = settings.get<string>('CDN_PREFIX')?.trim();
	const cdnJsCssPrefix = settings.get<string>('CDN_JSCSS_PREFIX')?.trim();
	const cdnForAll = settings.get<boolean>('CDN_PREFIX_ALL');

	if (cdnPrefix && cdnForAll) {
		return cdnPrefix;
	}

	if (cdnJsCssPrefix && !cdnForAll) {
		return cdnJsCssPrefix;
	}

	return __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
};

const readManifest = async (): Promise<{ manifest: ViteManifest; version: string } | undefined> => {
	try {
		const manifest = await readPrivateAssetText(MANIFEST);
		if (!manifest) {
			throw new Error('Empty manifest');
		}
		return { manifest: JSON.parse(manifest) as ViteManifest, version: createHash('sha1').update(manifest).digest('hex') };
	} catch (err) {
		// In development the Vite dev server puts the client into the page itself.
		if (process.env.NODE_ENV === 'production') {
			SystemLogger.error({ msg: 'The web client build is missing; the page will not load the client', manifest: MANIFEST, err });
		}
		return undefined;
	}
};

Meteor.startup(async () => {
	const build = await readManifest();
	if (!build) {
		return;
	}

	const { manifest, version } = build;
	Autoupdate.setClientVersion(version);

	settings.watchMultiple(['CDN_PREFIX', 'CDN_PREFIX_ALL', 'CDN_JSCSS_PREFIX'], () => {
		injectIntoHead('client-entry', getClientEntryTags(manifest, getBundlePrefix()));
	});
});
