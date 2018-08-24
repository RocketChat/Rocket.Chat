/* global MongoInternals */
import os from 'os';
import { HTTP } from 'meteor/http';
// import checkUpdate from '../checkUpdate';

export default () => {
	try {
		const uniqueID = RocketChat.models.Settings.findOne('uniqueID');
		const _oplogHandle = MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle;
		const oplogEnabled = _oplogHandle && _oplogHandle.onOplogEntry && RocketChat.settings.get('Force_Disable_OpLog_For_Cache') !== true;

		const data = {
			uniqueId: uniqueID.value,
			installedAt: uniqueID.createdAt,
			version: RocketChat.Info.version,
			oplogEnabled,
			osType: os.type(),
			osPlatform: os.platform(),
			osArch: os.arch(),
			osRelease: os.release(),
			nodeVersion: process.version,
			deployMethod: process.env.DEPLOY_METHOD || 'tar',
			deployPlatform: process.env.DEPLOY_PLATFORM || 'selfinstall'
		};

		const result = HTTP.get('https://releases.rocket.chat/updates/check', {
			params: data
		});

		return result.data;
	} catch (error) {
		// There's no need to log this error
		// as it's pointless and the user
		// can't do anything about it anyways

		return {
			versions: [],
			alerts: []
		};
	}
};
