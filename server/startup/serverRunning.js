import fs from 'fs';
import path from 'path';

import semver from 'semver';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';

import { SystemLogger } from '../../app/logger';
import { settings } from '../../app/settings';
import { Info, getMongoInfo } from '../../app/utils';
import { Roles, Users } from '../../app/models/server';

Meteor.startup(function() {
	const { oplogEnabled, mongoVersion, mongoStorageEngine } = getMongoInfo();

	const desiredNodeVersion = semver.clean(fs.readFileSync(path.join(process.cwd(), '../../.node_version.txt')).toString());
	const desiredNodeVersionMajor = String(semver.parse(desiredNodeVersion).major);

	return Meteor.setTimeout(function() {
		let msg = [
			`Rocket.Chat Version: ${ Info.version }`,
			`     NodeJS Version: ${ process.versions.node } - ${ process.arch }`,
			`    MongoDB Version: ${ mongoVersion }`,
			`     MongoDB Engine: ${ mongoStorageEngine }`,
			`           Platform: ${ process.platform }`,
			`       Process Port: ${ process.env.PORT }`,
			`           Site URL: ${ settings.get('Site_Url') }`,
			`   ReplicaSet OpLog: ${ oplogEnabled ? 'Enabled' : 'Disabled' }`,
		];

		if (Info.commit && Info.commit.hash) {
			msg.push(`        Commit Hash: ${ Info.commit.hash.substr(0, 10) }`);
		}

		if (Info.commit && Info.commit.branch) {
			msg.push(`      Commit Branch: ${ Info.commit.branch }`);
		}

		msg = msg.join('\n');

		if (!oplogEnabled) {
			msg += ['', '', 'OPLOG / REPLICASET IS REQUIRED TO RUN ROCKET.CHAT, MORE INFORMATION AT:', 'https://go.rocket.chat/i/oplog-required'].join('\n');
			SystemLogger.error_box(msg, 'SERVER ERROR');

			return process.exit(1);
		}

		if (!semver.satisfies(process.versions.node, desiredNodeVersionMajor)) {
			msg += ['', '', 'YOUR CURRENT NODEJS VERSION IS NOT SUPPORTED,', `PLEASE UPGRADE / DOWNGRADE TO VERSION ${ desiredNodeVersionMajor }.X.X`].join('\n');
			SystemLogger.error_box(msg, 'SERVER ERROR');

			return process.exit(1);
		}

		if (!semver.satisfies(semver.coerce(mongoVersion), '>=3.2.0')) {
			msg += ['', '', 'YOUR CURRENT MONGODB VERSION IS NOT SUPPORTED,', 'PLEASE UPGRADE TO VERSION 3.2 OR LATER'].join('\n');
			SystemLogger.error_box(msg, 'SERVER ERROR');

			return process.exit(1);
		}

		SystemLogger.startup_box(msg, 'SERVER RUNNING');

		// Deprecation
		if (!semver.satisfies(semver.coerce(mongoVersion), '>=3.4.0')) {
			msg = [`YOUR CURRENT MONGODB VERSION (${ mongoVersion }) IS DEPRECATED.`, 'IT WILL NOT BE SUPPORTED ON ROCKET.CHAT VERSION 2.0.0 AND GREATER,', 'PLEASE UPGRADE MONGODB TO VERSION 3.4 OR GREATER'].join('\n');
			SystemLogger.deprecation_box(msg, 'DEPRECATION');

			const id = `mongodbDeprecation_${ mongoVersion.replace(/[^0-9]/g, '_') }`;
			const title = 'MongoDB_Deprecated';
			const text = 'MongoDB_version_s_is_deprecated_please_upgrade_your_installation';
			const link = 'https://rocket.chat/docs/installation';

			Roles.findUsersInRole('admin').forEach((adminUser) => {
				if (Users.bannerExistsById(id)) {
					return;
				}

				try {
					Meteor.runAsUser(adminUser._id, () => Meteor.call('createDirectMessage', 'rocket.cat'));

					Meteor.runAsUser('rocket.cat', () => Meteor.call('sendMessage', {
						msg: `*${ TAPi18n.__(title, adminUser.language) }*\n${ TAPi18n.__(text, mongoVersion, adminUser.language) }\n${ link }`,
						rid: [adminUser._id, 'rocket.cat'].sort().join(''),
					}));
				} catch (e) {
					console.error(e);
				}

				Users.addBannerById(adminUser._id, {
					id,
					priority: 100,
					title,
					text,
					textArguments: [mongoVersion],
					modifiers: ['danger'],
					link,
				});
			});
		}
	}, 100);
});
