/* globals MongoInternals, SystemLogger */

import fs from 'fs';
import path from 'path';
import semver from 'semver';

Meteor.startup(function() {
	let oplogState = 'Disabled';
	if (MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle && MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle.onOplogEntry) {
		oplogState = 'Enabled';
		if (RocketChat.settings.get('Force_Disable_OpLog_For_Cache') === true) {
			oplogState += ' (Disabled for Cache Sync)';
		}
	}

	const desiredNodeVersion = semver.clean(fs.readFileSync(path.join(process.cwd(), '../../.node_version.txt')).toString());
	const desiredNodeVersionMajor = String(semver.parse(desiredNodeVersion).major);

	return Meteor.setTimeout(function() {
		let msg = [
			`Rocket.Chat Version: ${ RocketChat.Info.version }`,
			`     NodeJS Version: ${ process.versions.node } - ${ process.arch }`,
			`           Platform: ${ process.platform }`,
			`       Process Port: ${ process.env.PORT }`,
			`           Site URL: ${ RocketChat.settings.get('Site_Url') }`,
			`   ReplicaSet OpLog: ${ oplogState }`
		];

		if (RocketChat.Info.commit && RocketChat.Info.commit.hash) {
			msg.push(`        Commit Hash: ${ RocketChat.Info.commit.hash.substr(0, 10) }`);
		}

		if (RocketChat.Info.commit && RocketChat.Info.commit.branch) {
			msg.push(`      Commit Branch: ${ RocketChat.Info.commit.branch }`);
		}

		msg = msg.join('\n');

		if (semver.satisfies(process.versions.node, desiredNodeVersionMajor)) {
			return SystemLogger.startup_box(msg, 'SERVER RUNNING');
		}

		msg += ['', '', 'YOUR CURRENT NODEJS VERSION IS NOT SUPPORTED,', `PLEASE UPGRADE / DOWNGRADE TO VERSION ${ desiredNodeVersionMajor }.X.X`].join('\n');

		SystemLogger.error_box(msg, 'SERVER ERROR');

		return process.exit();
	}, 100);
});
