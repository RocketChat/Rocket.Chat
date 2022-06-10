import os from 'os';

import { HTTP } from 'meteor/http';
import { check, Match } from 'meteor/check';

import { Settings } from '../../../models';
import { Info } from '../../../utils';
import { getWorkspaceAccessToken } from '../../../cloud/server';

export default () => {
	try {
		const uniqueID = Settings.findOne('uniqueID');

		const params = {
			uniqueId: uniqueID.value,
			installedAt: uniqueID.createdAt.toJSON(),
			version: Info.version,
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
			headers.Authorization = `Bearer ${token}`;
		}

		const { data } = HTTP.get('https://releases.rocket.chat/updates/check', {
			params,
			headers,
		});

		check(
			data,
			Match.ObjectIncluding({
				versions: [
					Match.ObjectIncluding({
						version: Match.Optional(String),
						security: Match.Optional(Boolean),
						infoUrl: Match.Optional(String),
					}),
				],
				alerts: Match.Optional([
					Match.ObjectIncluding({
						id: Match.Optional(String),
						title: Match.Optional(String),
						text: Match.Optional(String),
						textArguments: Match.Optional([Match.Any]),
						modifiers: Match.Optional([String]),
						infoUrl: Match.Optional(String),
					}),
				]),
			}),
		);

		return data;
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
