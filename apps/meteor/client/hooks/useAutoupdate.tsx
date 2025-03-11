// import type { StreamerEvents } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';
import { useEffect } from 'react';

import { ClientVersions } from './client_versions';

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

const clientVersions = new ClientVersions();

export const useAutoupdate = () => {
	// const stream = useStream('meteor_autoupdate_clientVersions');

	useEffect(() => {
		// Meteor.connection.registerStoreClient('meteor_autoupdate_clientVersions', clientVersions.createStore());

		Meteor.subscribe('meteor_autoupdate_clientVersions', {
			onReady: () => {
				console.log('onReady');
				const checkNewVersionDocument = (doc: Doc) => {
					console.log('---doc', doc);
					if (doc._id !== clientArch) {
						return;
					}
					if (doc.versionNonRefreshable !== autoupdateVersions.versionNonRefreshable) {
						if (stop) stop();
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

				const stop = clientVersions.watch(checkNewVersionDocument);
			},
		});
		// stream(undefined, (doc) => {
		// 	checkNewVersionDocument(doc);
		// });
	}, []);
};
