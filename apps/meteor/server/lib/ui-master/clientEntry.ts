import { Meteor } from 'meteor/meteor';

import type { ViteManifest } from './clientEntryTags';
import { getClientEntryTags } from './clientEntryTags';
import { injectIntoHead } from './inject';
import { settings } from '../../settings';
import { SystemLogger } from '../logger/system';

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

const readManifest = async (): Promise<ViteManifest | undefined> => {
	try {
		const manifest = await Assets.getTextAsync(MANIFEST);
		if (!manifest) {
			throw new Error('Empty manifest');
		}
		return JSON.parse(manifest) as ViteManifest;
	} catch (err) {
		// In development the Vite dev server puts the client into the page itself.
		if (process.env.NODE_ENV === 'production') {
			SystemLogger.error({ msg: 'The web client build is missing; the page will not load the client', manifest: MANIFEST, err });
		}
		return undefined;
	}
};

Meteor.startup(async () => {
	const manifest = await readManifest();
	if (!manifest) {
		return;
	}

	settings.watchMultiple(['CDN_PREFIX', 'CDN_PREFIX_ALL', 'CDN_JSCSS_PREFIX'], () => {
		injectIntoHead('client-entry', getClientEntryTags(manifest, getBundlePrefix()));
	});
});
