import os from 'os';
import { HTTP } from 'meteor/http';
import { Settings } from '/app/models';
import { settings } from '/app/settings';
import { Info } from '/app/utils';
import { getWorkspaceAccessToken } from '/app/cloud';
import { MongoInternals } from 'meteor/mongo';

export default () => {
	try {
		const uniqueID = Settings.findOne('uniqueID');
		const { _oplogHandle } = MongoInternals.defaultRemoteCollectionDriver().mongo;
		const oplogEnabled = _oplogHandle && _oplogHandle.onOplogEntry && settings.get('Force_Disable_OpLog_For_Cache') !== true;

		const data = {
			uniqueId: uniqueID.value,
			installedAt: uniqueID.createdAt,
			version: Info.version,
			oplogEnabled,
			osType: os.type(),
			osPlatform: os.platform(),
			osArch: os.arch(),
			osRelease: os.release(),
			nodeVersion: process.version,
			deployMethod: process.env.DEPLOY_METHOD || 'tar',
			deployPlatform: process.env.DEPLOY_PLATFORM || 'selfinstall',
		};

		const headers = {};
		const token = getWorkspaceAccessToken();
		if (token) {
			headers.Authorization = `Bearer ${ token }`;
		}

		const result = HTTP.get('https://releases.rocket.chat/updates/check', {
			params: data,
			headers,
		});

		return result.data;
	} catch (error) {
		// There's no need to log this error
		// as it's pointless and the user
		// can't do anything about it anyways

		return {
			versions: [],
			alerts: [],
		};
	}
};
