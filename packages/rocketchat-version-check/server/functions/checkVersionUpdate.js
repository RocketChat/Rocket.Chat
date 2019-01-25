import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import { RocketChat } from 'meteor/rocketchat:lib';
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

	const lastCheckedVersion = RocketChat.settings.get('Update_LatestAvailableVersion');
	versions.forEach((version) => {
		if (semver.lte(version.version, lastCheckedVersion)) {
			return;
		}

		if (semver.lte(version.version, RocketChat.Info.version)) {
			return;
		}

		update.exists = true;
		update.lastestVersion = version;

		if (version.security === true) {
			update.security = true;
		}
	});

	if (update.exists) {
		RocketChat.settings.updateById('Update_LatestAvailableVersion', update.lastestVersion.version);
		RocketChat.models.Roles.findUsersInRole('admin').forEach((adminUser) => {
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

			RocketChat.models.Users.addBannerById(adminUser._id, {
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
		RocketChat.models.Roles.findUsersInRole('admin').forEach((adminUser) => {
			try {
				Meteor.runAsUser(adminUser._id, () => Meteor.call('createDirectMessage', 'rocket.cat'));

				alerts.forEach((alert) => {
					if (RocketChat.models.Users.bannerExistsById(adminUser._id, `alert-${ alert.id }`)) {
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
				RocketChat.models.Users.addBannerById(adminUser._id, {
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
