// Subscribe to the `meteor_autoupdate_clientVersions` collection,
// which contains the set of acceptable client versions.
//
// A "hard code push" occurs when the running client version is not in
// the set of acceptable client versions (or the server updates the
// collection, there is a published client version marked `current` and
// the running client version is no longer in the set).
//
// When the `reload` package is loaded, a hard code push causes
// the browser to reload, so that it will load the latest client
// version from the server.
//
// A "soft code push" represents the situation when the running client
// version is in the set of acceptable versions, but there is a newer
// version available on the server.
//
// `Autoupdate.newClientAvailable` is a reactive data source which
// becomes `true` if a new version of the client is available on
// the server.
//
// This package doesn't implement a soft code reload process itself,
// but `newClientAvailable` could be used for example to display a
// "click to reload" link to the user.

// The client version of the client code currently running in the
// browser.

import { ClientVersions } from './client_versions.js';

const clientArch = Meteor.isCordova ? 'web.cordova' : Meteor.isModern ? 'web.browser' : 'web.browser.legacy';

const autoupdateVersions = ((__meteor_runtime_config__.autoupdate || {}).versions || {})[clientArch] || {
	version: 'unknown',
	versionRefreshable: 'unknown',
	versionNonRefreshable: 'unknown',
	assets: [],
};

export const Autoupdate = {};

// Stores acceptable client versions.
const clientVersions = (Autoupdate._clientVersions = // Used by a self-test and hot-module-replacement
	new ClientVersions());

Meteor.connection.registerStoreClient('meteor_autoupdate_clientVersions', clientVersions.createStore());

Autoupdate.newClientAvailable = function () {
	return clientVersions.newClientAvailable(clientArch, ['versionRefreshable', 'versionNonRefreshable'], autoupdateVersions);
};

// Set to true if the link.onload callback ever fires for any <link> node.
let knownToSupportCssOnLoad = false;

const retry = new Retry({
	// Unlike the stream reconnect use of Retry, which we want to be instant
	// in normal operation, this is a wacky failure. We don't want to retry
	// right away, we can start slowly.
	//
	// A better way than timeconstants here might be to use the knowledge
	// of when we reconnect to help trigger these retries. Typically, the
	// server fixing code will result in a restart and reconnect, but
	// potentially the subscription could have a transient error.
	minCount: 0, // don't do any immediate retries
	baseTimeout: 30 * 1000, // start with 30s
});

let failures = 0;

Autoupdate._retrySubscription = () => {
	Meteor.subscribe('meteor_autoupdate_clientVersions', {
		onError(error) {
			Meteor._debug('autoupdate subscription failed', error);
			failures++;
			retry.retryLater(failures, function () {
				// Just retry making the subscription, don't reload the whole
				// page. While reloading would catch more cases (for example,
				// the server went back a version and is now doing old-style hot
				// code push), it would also be more prone to reload loops,
				// which look really bad to the user. Just retrying the
				// subscription over DDP means it is at least possible to fix by
				// updating the server.
				Autoupdate._retrySubscription();
			});
		},

		onReady() {
			// Call checkNewVersionDocument with a slight delay, so that the
			// const handle declaration is guaranteed to be initialized, even if
			// the added or changed callbacks are called synchronously.
			const resolved = Promise.resolve();
			function check(doc) {
				resolved.then(() => checkNewVersionDocument(doc));
			}

			const stop = clientVersions.watch(check);

			const reloadDelayInSeconds = Meteor.isProduction ? 60 : 0;

			function checkNewVersionDocument(doc) {
				if (doc._id !== clientArch) {
					return;
				}

				if (doc.versionNonRefreshable !== autoupdateVersions.versionNonRefreshable) {
					// Non-refreshable assets have changed, so we have to reload the
					// whole page rather than just replacing <link> tags.
					if (stop) stop();
					if (Package.reload) {
						// The reload package should be provided by ddp-client, which
						// is provided by the ddp package that autoupdate depends on.

						// Delay reload in 60 seconds
						console.warn(
							'Client version changed from',
							autoupdateVersions.versionNonRefreshable,
							'to',
							doc.versionNonRefreshable,
							`Page will reload in ${reloadDelayInSeconds} seconds`,
						);
						document.dispatchEvent(new Event('client_changed'));
					}
					return;
				}

				if (doc.versionRefreshable !== autoupdateVersions.versionRefreshable) {
					autoupdateVersions.versionRefreshable = doc.versionRefreshable;

					// Switch out old css links for the new css links. Inspired by:
					// https://github.com/guard/guard-livereload/blob/master/js/livereload.js#L710
					var newCss = doc.assets || [];
					var oldLinks = [];

					Array.prototype.forEach.call(document.getElementsByTagName('link'), function (link) {
						if (link.className === '__meteor-css__') {
							oldLinks.push(link);
						}
					});

					function waitUntilCssLoads(link, callback) {
						var called;

						link.onload = function () {
							knownToSupportCssOnLoad = true;
							if (!called) {
								called = true;
								callback();
							}
						};

						if (!knownToSupportCssOnLoad) {
							var id = Meteor.setInterval(function () {
								if (link.sheet) {
									if (!called) {
										called = true;
										callback();
									}
									Meteor.clearInterval(id);
								}
							}, 50);
						}
					}

					let newLinksLeftToLoad = newCss.length;
					function removeOldLinks() {
						if (oldLinks.length > 0 && --newLinksLeftToLoad < 1) {
							oldLinks.splice(0).forEach((link) => {
								link.parentNode.removeChild(link);
							});
						}
					}

					if (newCss.length > 0) {
						newCss.forEach((css) => {
							const newLink = document.createElement('link');
							newLink.setAttribute('rel', 'stylesheet');
							newLink.setAttribute('type', 'text/css');
							newLink.setAttribute('class', '__meteor-css__');
							newLink.setAttribute('href', css.url);

							waitUntilCssLoads(newLink, function () {
								Meteor.setTimeout(removeOldLinks, 200);
							});

							const head = document.getElementsByTagName('head').item(0);
							head.appendChild(newLink);
						});
					} else {
						removeOldLinks();
					}
				}
			}
		},
	});
};

Autoupdate._retrySubscription();
