// Publish the current client versions for each client architecture
// (web.browser, web.browser.legacy, web.cordova). When a client observes
// a change in the versions associated with its client architecture,
// it will refresh itself, either by swapping out CSS assets or by
// reloading the page. Changes to the replaceable version are ignored
// and handled by the hot-module-replacement package.
//
// There are four versions for any given client architecture: `version`,
// `versionRefreshable`, `versionNonRefreshable`, and
// `versionReplaceable`. The refreshable version is a hash of just the
// client resources that are refreshable, such as CSS. The replaceable
// version is a hash of files that can be updated with HMR. The
// non-refreshable version is a hash of the rest of the client assets,
// excluding the refreshable ones: HTML, JS that is not replaceable, and
// static files in the `public` directory. The `version` version is a
// combined hash of everything.
//
// If the environment variable `AUTOUPDATE_VERSION` is set, it will be
// used in place of all client versions. You can use this variable to
// control when the client reloads. For example, if you want to force a
// reload only after major changes, use a custom AUTOUPDATE_VERSION and
// change it only when something worth pushing to clients happens.
//
// The server publishes a `meteor_autoupdate_clientVersions` collection.
// The ID of each document is the client architecture, and the fields of
// the document are the versions described above.

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

// The client hash includes __meteor_runtime_config__, so wait until
// all packages have loaded and have had a chance to populate the
// runtime config before using the client hash as our default auto
// update version id.

// Note: Tests allow people to override Autoupdate.autoupdateVersion before
// startup.
Autoupdate.autoupdateVersion = null;
Autoupdate.autoupdateVersionRefreshable = null;
Autoupdate.autoupdateVersionCordova = null;
Autoupdate.appId = __meteor_runtime_config__.appId = process.env.APP_ID;

var syncQueue = new Meteor._AsynchronousQueue();

async function updateVersions(shouldReloadClientProgram) {
	// Step 1: load the current client program on the server
	if (shouldReloadClientProgram) {
		await WebAppInternals.reloadClientPrograms();
	}

	const {
		// If the AUTOUPDATE_VERSION environment variable is defined, it takes
		// precedence, but Autoupdate.autoupdateVersion is still supported as
		// a fallback. In most cases neither of these values will be defined.
		AUTOUPDATE_VERSION = Autoupdate.autoupdateVersion,
	} = process.env;

	// Step 2: update __meteor_runtime_config__.autoupdate.versions.
	const clientArchs = Object.keys(WebApp.clientPrograms);
	clientArchs.forEach((arch) => {
		Autoupdate.versions[arch] = {
			version: AUTOUPDATE_VERSION || WebApp.calculateClientHash(arch),
			versionRefreshable: AUTOUPDATE_VERSION || WebApp.calculateClientHashRefreshable(arch),
			versionNonRefreshable: AUTOUPDATE_VERSION || WebApp.calculateClientHashNonRefreshable(arch),
			versionReplaceable: AUTOUPDATE_VERSION || WebApp.calculateClientHashReplaceable(arch),
			versionHmr: WebApp.clientPrograms[arch].hmrVersion,
		};
	});

	// Step 3: form the new client boilerplate which contains the updated
	// assets and __meteor_runtime_config__.
	if (shouldReloadClientProgram) {
		await WebAppInternals.generateBoilerplate();
	}

	// Step 4: update the ClientVersions collection.
	// We use `onListening` here because we need to use
	// `WebApp.getRefreshableAssets`, which is only set after
	// `WebApp.generateBoilerplate` is called by `main` in webapp.
	WebApp.onListening(() => {
		clientArchs.forEach((arch) => {
			const payload = {
				...Autoupdate.versions[arch],
				assets: WebApp.getRefreshableAssets(arch),
			};

			clientVersions.set(arch, payload);
		});
	});
}

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

Meteor.startup(async function () {
	await updateVersions(false);

	// Force any connected clients that are still looking for these older
	// document IDs to reload.
	['version', 'version-refreshable', 'version-cordova'].forEach((_id) => {
		clientVersions.set(_id, {
			version: 'outdated',
		});
	});
});

function enqueueVersionsRefresh() {
	syncQueue.queueTask(async function () {
		await updateVersions(true);
	});
}

const setupListeners = () => {
	// Listen for messages pertaining to the client-refresh topic.
	import { onMessage } from 'meteor/inter-process-messaging';
	onMessage('client-refresh', enqueueVersionsRefresh);

	// Another way to tell the process to refresh: send SIGHUP signal
	process.on(
		'SIGHUP',
		Meteor.bindEnvironment(function () {
			enqueueVersionsRefresh();
		}, 'handling SIGHUP signal for refresh'),
	);
};

WebApp.onListening(function () {
	Promise.resolve(setupListeners());
});
