import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { SyncedCron } from 'meteor/littledata:synced-cron';

import { Apps } from './orchestrator';
import { getWorkspaceAccessToken } from '../../cloud/server';
import { Settings } from '../../models/server';

export const appsUpdateMarketplaceInfo = Meteor.bindEnvironment(() => {
	const token = getWorkspaceAccessToken();
	const baseUrl = Apps.getMarketplaceUrl();
	const [workspaceIdSetting] = Settings.findById('Cloud_Workspace_Id').fetch();

	const fullUrl = `${ baseUrl }/v1/workspaces/${ workspaceIdSetting.value }/apps`;
	const options = {
		headers: {
			Authorization: `Bearer ${ token }`,
		},
	};

	let data = [];

	try {
		const result = HTTP.get(fullUrl, options);

		if (Array.isArray(result.data)) {
			data = result.data;
		}
	} catch (err) {
		Apps.debugLog(err);
	}

	Promise.await(Apps.updateAppsMarketplaceInfo(data));
});

SyncedCron.add({
	name: 'Apps-Engine:check',
	schedule: (parser) => parser.text('at 4:00 pm'),
	job() {
		appsUpdateMarketplaceInfo();
	},
});

SyncedCron.start();
