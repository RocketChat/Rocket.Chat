import { getClientBuild } from '../lib/meteorRuntimeConfig';
import { getDdpSdk } from '../lib/sdk/ddpSdk';

// Tells the app once the server serves a different client build than the one this page runs, so it can offer a reload.
const CLIENT_VERSIONS = 'meteor_autoupdate_clientVersions';

const watchClientVersion = (): void => {
	const current = getClientBuild();
	if (!current) {
		return;
	}

	const { client, connection } = getDdpSdk();

	const stop = client.onCollection(CLIENT_VERSIONS, (data) => {
		if (data.msg === 'removed' || data.id !== current.arch) {
			return;
		}

		const { versionRefreshable, versionNonRefreshable } = data.fields ?? {};
		const changed =
			(versionNonRefreshable !== undefined && versionNonRefreshable !== current.versionNonRefreshable) ||
			(versionRefreshable !== undefined && versionRefreshable !== current.versionRefreshable);
		if (!changed) {
			return;
		}

		stop();
		document.dispatchEvent(new Event('client_changed'));
	});

	void connection
		.whenConnected()
		.then(() => client.subscribe(CLIENT_VERSIONS))
		.catch(() => undefined);
};

watchClientVersion();
