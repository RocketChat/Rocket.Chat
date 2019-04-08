import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import { settings } from '../../../settings';
import { Info } from '../../../utils';
import { Roles, Users } from '../../../models';
import semver from 'semver';
import logger from '../logger';
import getNewUpdates from './getNewUpdates';
// import getNewUpdates from '../sampleUpdateData';

export default () => {
	logger.info('Checking for version updates');

	const { versions, alerts } = getNewUpdates();

	const update = {
		exists: false,
		lastestVersion: null,
		security: false,
	};

	const lastCheckedVersion = settings.get('Update_LatestAvailableVersion');
	versions.forEach((version) => {
		if (semver.lte(version.version, lastCheckedVersion)) {
			return;
		}

		if (semver.lte(version.version, Info.version)) {
			return;
		}

		update.exists = true;
		update.lastestVersion = version;

		if (version.security === true) {
			update.security = true;
		}
	});

	if (update.exists) {
		settings.updateById('Update_LatestAvailableVersion', update.lastestVersion.version);
		Roles.findUsersInRole('admin').forEach((adminUser) => {
			try {
				Meteor.runAsUser(adminUser._id, () => Meteor.call('createDirectMessage', 'rocket.cat'));

				const msg = {
					msg: `*${ TAPi18n.__('Update_your_RocketChat', adminUser.language) }*\n${ TAPi18n.__('New_version_available_(s)', update.lastestVersion.version, adminUser.language) }\n${ update.lastestVersion.infoUrl }`,
					rid: [adminUser._id, 'rocket.cat'].sort().join(''),
				};

				Meteor.runAsUser('rocket.cat', () => Meteor.call('sendMessage', msg));
			} catch (e) {
				console.error(e);
			}

			Users.addBannerById(adminUser._id, {
				id: 'versionUpdate',
				priority: 10,
				title: 'Update_your_RocketChat',
				text: 'New_version_available_(s)',
				textArguments: [update.lastestVersion.version],
				link: update.lastestVersion.infoUrl,
			});
		});
	}

	if (alerts && alerts.length) {
		Roles.findUsersInRole('admin').forEach((adminUser) => {
			try {
				Meteor.runAsUser(adminUser._id, () => Meteor.call('createDirectMessage', 'rocket.cat'));

				alerts.forEach((alert) => {
					if (Users.bannerExistsById(adminUser._id, `alert-${ alert.id }`)) {
						return;
					}

					const msg = {
						msg: `*${ TAPi18n.__('Rocket_Chat_Alert', adminUser.language) }:*\n\n*${ TAPi18n.__(alert.title, adminUser.language) }*\n${ TAPi18n.__(alert.text, ...(alert.textArguments || []), adminUser.language) }\n${ alert.infoUrl }`,
						rid: [adminUser._id, 'rocket.cat'].sort().join(''),
					};

					Meteor.runAsUser('rocket.cat', () => Meteor.call('sendMessage', msg));
				});
			} catch (e) {
				console.error(e);
			}

			alerts.forEach((alert) => {
				Users.addBannerById(adminUser._id, {
					id: `alert-${ alert.id }`,
					priority: 10,
					title: alert.title,
					text: alert.text,
					textArguments: alert.textArguments,
					modifiers: alert.modifiers,
					link: alert.infoUrl,
				});
			});
		});
	}
};
