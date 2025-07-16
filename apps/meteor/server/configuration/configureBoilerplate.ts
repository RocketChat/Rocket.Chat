import { createHash } from 'crypto';

import { Meteor } from 'meteor/meteor';
import { WebApp, WebAppInternals } from 'meteor/webapp';

import type { ICachedSettings } from '../../app/settings/server/CachedSettings';

const webAppHashes: Record<string, string> = {};

export function getWebAppHash(arch: string): string | undefined {
	if (!webAppHashes[arch]) {
		const program = WebApp.clientPrograms[arch] as (typeof WebApp.clientPrograms)[string] & {
			meteorRuntimeConfig: string;
		};
		webAppHashes[arch] = createHash('sha1')
			.update(JSON.stringify(encodeURIComponent(program.meteorRuntimeConfig)))
			.digest('hex');
	}

	return webAppHashes[arch];
}

const { generateBoilerplate } = WebAppInternals;

WebAppInternals.generateBoilerplate = function (...args: Parameters<typeof generateBoilerplate>) {
	for (const arch of Object.keys(WebApp.clientPrograms)) {
		delete webAppHashes[arch];
	}
	return generateBoilerplate.apply(this, args);
};

export function configureBoilerplate(settings: ICachedSettings): void {
	settings.watch<string>(
		'Site_Url',
		// Needed as WebAppInternals.generateBoilerplate needs to be called in a fiber
		Meteor.bindEnvironment(async (value) => {
			if (value == null || value.trim() === '') {
				return;
			}
			let host = value.replace(/\/$/, '');
			// let prefix = '';
			const match = value.match(/([^\/]+\/{2}[^\/]+)(\/.+)/);
			if (match != null) {
				host = match[1];
				// prefix = match[2].replace(/\/$/, '');
			}
			(global as any).__meteor_runtime_config__.ROOT_URL = value;

			if (Meteor.absoluteUrl.defaultOptions?.rootUrl) {
				Meteor.absoluteUrl.defaultOptions.rootUrl = value;
			}

			// hostname = host.replace(/^https?:\/\//, '');
			process.env.MOBILE_ROOT_URL = host;
			process.env.MOBILE_DDP_URL = host;
			if (typeof WebAppInternals !== 'undefined' && WebAppInternals.generateBoilerplate) {
				await WebAppInternals.generateBoilerplate();
			}
		}),
	);
}
