import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { SyncedCron } from 'meteor/littledata:synced-cron';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import { Apps } from './orchestrator';
import { getWorkspaceAccessToken } from '../../cloud/server';
import { Settings, Users, Roles } from '../../models/server';


const notifyAdminsAboutInvalidApps = Meteor.bindEnvironment(function _notifyAdminsAboutInvalidApps(apps) {
	if (!apps) {
		return;
	}

	const hasInvalidApps = !!apps.find((app) => app.getLatestLicenseValidationResult().hasErrors);

	if (!hasInvalidApps) {
		return;
	}

	const id = 'someAppInInvalidState';
	const title = 'Warning';
	const text = 'There is one or more apps in an invalid state. Click here to review.';
	const rocketCatMessage = 'There is one or more apps in an invalid state. Go to Administration > Apps to review.';
	const link = '/admin/apps';

	Roles.findUsersInRole('admin').forEach((adminUser) => {
		Users.removeBannerById(adminUser._id, { id });

		try {
			Meteor.runAsUser(adminUser._id, () => Meteor.call('createDirectMessage', 'rocket.cat'));

			Meteor.runAsUser('rocket.cat', () => Meteor.call('sendMessage', {
				msg: `*${ TAPi18n.__(title, adminUser.language) }*\n${ TAPi18n.__(rocketCatMessage, adminUser.language) }`,
				rid: [adminUser._id, 'rocket.cat'].sort().join(''),
			}));
		} catch (e) {
			console.error(e);
		}

		Users.addBannerById(adminUser._id, {
			id,
			priority: 10,
			title,
			text,
			modifiers: ['danger'],
			link,
		});
	});

	return apps;
});

const notifyAdminsAboutRenewedApps = Meteor.bindEnvironment(function _notifyAdminsAboutRenewedApps(apps) {
	if (!apps) {
		return;
	}

	const renewedApps = apps.filter((app) => app.getStatus() === AppStatus.DISABLED && app.getPreviousStatus() === AppStatus.INVALID_LICENSE_DISABLED);

	if (renewedApps.length === 0) {
		return;
	}

	const rocketCatMessage = 'There is one or more disabled apps with valid licenses. Go to Administration > Apps to review.';

	Roles.findUsersInRole('admin').forEach((adminUser) => {
		try {
			Meteor.runAsUser(adminUser._id, () => Meteor.call('createDirectMessage', 'rocket.cat'));

			Meteor.runAsUser('rocket.cat', () => Meteor.call('sendMessage', {
				msg: `${ TAPi18n.__(rocketCatMessage, adminUser.language) }`,
				rid: [adminUser._id, 'rocket.cat'].sort().join(''),
			}));
		} catch (e) {
			console.error(e);
		}
	});
});

export const appsUpdateMarketplaceInfo = Meteor.bindEnvironment(function _appsUpdateMarketplaceInfo() {
	const token = getWorkspaceAccessToken();
	const baseUrl = Apps.getMarketplaceUrl();
	const [workspaceIdSetting] = Settings.findById('Cloud_Workspace_Id').fetch();

	const currentSeats = Users.getActiveLocalUserCount();

	const fullUrl = `${ baseUrl }/v1/workspaces/${ workspaceIdSetting.value }/apps?seats=${ currentSeats }`;
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

	Promise.await(
		Apps.updateAppsMarketplaceInfo(data)
			.then(notifyAdminsAboutInvalidApps)
			.then(notifyAdminsAboutRenewedApps)
	);
});

SyncedCron.add({
	name: 'Apps-Engine:check',
	schedule: (parser) => parser.text('at 4:00 am'),
	job() {
		appsUpdateMarketplaceInfo();
	},
});

SyncedCron.start();
