// Publishes the version of the web client the server serves. A page that
// runs another version sees its document change and offers a reload.
//
// If the environment variable `AUTOUPDATE_VERSION` is set, it is used in
// place of the client version, to control when clients reload.
//
// The server publishes a `meteor_autoupdate_clientVersions` collection.
// The ID of each document is the client architecture, and the fields of
// the document are its versions.

import { Meteor } from 'meteor/meteor';
import { ClientVersions } from './client_versions.js';

export const Autoupdate = (__meteor_runtime_config__.autoupdate = {
	// Map from client architectures (web.browser, web.browser.legacy,
	// web.cordova) to version fields { version, versionRefreshable,
	// versionNonRefreshable, refreshable } that will be stored in
	// ClientVersions documents (whose IDs are client architectures). This
	// data gets serialized into the boilerplate because it's stored in
	// __meteor_runtime_config__.autoupdate.versions.
	versions: {},
});

// Stores acceptable client versions.
const clientVersions = new ClientVersions();

// Note: Tests allow people to override Autoupdate.autoupdateVersion before
// startup.
Autoupdate.autoupdateVersion = null;
Autoupdate.appId = __meteor_runtime_config__.appId = process.env.APP_ID;

// The web client is built outside Meteor, so the server names its version once it knows which build it serves.
const CLIENT_ARCH = 'web.browser';

Autoupdate.setClientVersion = function (clientVersion) {
	// If the AUTOUPDATE_VERSION environment variable is defined, it takes
	// precedence, but Autoupdate.autoupdateVersion is still supported as
	// a fallback.
	const { AUTOUPDATE_VERSION = Autoupdate.autoupdateVersion } = process.env;
	const version = AUTOUPDATE_VERSION || clientVersion;

	Autoupdate.versions[CLIENT_ARCH] = {
		version,
		versionRefreshable: version,
		versionNonRefreshable: version,
	};

	clientVersions.set(CLIENT_ARCH, { ...Autoupdate.versions[CLIENT_ARCH], assets: [] });
};

Meteor.publish(
	'meteor_autoupdate_clientVersions',
	function (appId) {
		// `null` happens when a client doesn't have an appId and passes
		// `undefined` to `Meteor.subscribe`. `undefined` is translated to
		// `null` as JSON doesn't have `undefined.
		check(appId, Match.OneOf(String, undefined, null));

		// Don't notify clients using wrong appId such as mobile apps built with a
		// different server but pointing at the same local url
		if (Autoupdate.appId && appId && Autoupdate.appId !== appId) return [];

		// Random value to delay the updates for 2-10 minutes
		const randomInterval = Meteor.isProduction ? (Math.floor(Math.random() * 8) + 2) * 1000 * 60 : 0;

		const stop = clientVersions.watch((version, isNew) => {
			setTimeout(() => {
				(isNew ? this.added : this.changed).call(this, 'meteor_autoupdate_clientVersions', version._id, version);
			}, randomInterval);
		});

		this.onStop(() => stop());
		this.ready();
	},
	{ is_auto: true },
);

Meteor.startup(function () {
	// Force any connected clients that are still looking for these older
	// document IDs to reload.
	['version', 'version-refreshable', 'version-cordova'].forEach((_id) => {
		clientVersions.set(_id, {
			version: 'outdated',
		});
	});
});
