import semver from 'semver';
import getNewUpdates from './getNewUpdates';
import logger from '../logger';

export default () => {
	logger.info('Checking for version updates');

	const { versions } = getNewUpdates();

	const update = {
		exists: false,
		lastestVersion: null,
		security: false
	};

	const lastCheckedVersion = RocketChat.settings.get('Update_LatestAvailableVersion');
	versions.forEach(version => {
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
		RocketChat.models.Roles.findUsersInRole('admin').forEach(adminUser => {
			const msg = {
				msg: `*${ TAPi18n.__('Update_your_RocketChat', adminUser.language) }*\n${ TAPi18n.__('New_version_available_(s)', update.lastestVersion.version, adminUser.language) }\n${ update.lastestVersion.infoUrl }`,
				rid: [adminUser._id, 'rocket.cat'].sort().join('')
			};

			Meteor.runAsUser('rocket.cat', () => Meteor.call('sendMessage', msg));

			RocketChat.models.Users.addBannerById(adminUser._id, {
				id: 'versionUpdate',
				priority: 10,
				title: 'Update_your_RocketChat',
				text: 'New_version_available_(s)',
				textArguments: [update.lastestVersion.version],
				link: update.lastestVersion.infoUrl
			});
		});
	}
};
