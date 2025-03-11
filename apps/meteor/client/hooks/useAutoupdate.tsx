// import type { StreamerEvents } from '@rocket.chat/ddp-client';
import { useStream } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { useEffect } from 'react';

// import { ClientVersions } from './client_versions';
// eslint-disable-next-line no-nested-ternary
const clientArch = Meteor.isCordova ? 'web.cordova' : Meteor.isModern ? 'web.browser' : 'web.browser.legacy';
const reloadDelayInSeconds = Meteor.isProduction ? 60 : 0;

const autoupdateVersions = (__meteor_runtime_config__ as any).autoupdate?.versions?.[clientArch] || {
	version: 'unknown',
	versionRefreshable: 'unknown',
	versionNonRefreshable: 'unknown',
	assets: [],
};

type Doc = {
	_id: string;
	version: string;
	versionRefreshable?: string;
	versionNonRefreshable?: string;
	versionReplaceable: string;
	versionHmr?: number;
	assets?: [
		{
			url: string;
		},
	];
};

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	export interface StreamerEvents {
		meteor_autoupdate_clientVersions: [
			{
				key: undefined;
				args: [Doc];
			},
		];
	}
}

export const useAutoupdate = () => {
	const stream = useStream('meteor_autoupdate_clientVersions');

	useEffect(() => {
		// const clientVersions = new ClientVersions();
		stream(undefined, (doc) => {
			checkNewVersionDocument(doc);
		});

		const checkNewVersionDocument = (doc: Doc) => {
			console.log('---doc', doc);
			if (doc._id !== clientArch) {
				return;
			}

			if (doc.versionNonRefreshable !== autoupdateVersions.versionNonRefreshable) {
				console.warn(
					'Client version changed from',
					autoupdateVersions.versionNonRefreshable,
					'to',
					doc.versionNonRefreshable,
					`Page will reload in ${reloadDelayInSeconds} seconds`,
				);
				setTimeout(() => {
					console.log('timeout');
				});
			}
		};
	}, [stream]);
};
