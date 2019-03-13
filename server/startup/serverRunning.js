import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';
import { SystemLogger } from '/app/logger';
import { settings } from '/app/settings';
import { Info } from '/app/utils';
import fs from 'fs';
import path from 'path';
import semver from 'semver';

Meteor.startup(function() {
	let oplogState = 'Disabled';
	if (MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle && MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle.onOplogEntry) {
		oplogState = 'Enabled';
		if (settings.get('Force_Disable_OpLog_For_Cache') === true) {
			oplogState += ' (Disabled for Cache Sync)';
		}
	}

	const desiredNodeVersion = semver.clean(fs.readFileSync(path.join(process.cwd(), '../../.node_version.txt')).toString());
	const desiredNodeVersionMajor = String(semver.parse(desiredNodeVersion).major);

	return Meteor.setTimeout(function() {
		let msg = [
			`Rocket.Chat Version: ${ Info.version }`,
			`     NodeJS Version: ${ process.versions.node } - ${ process.arch }`,
			`           Platform: ${ process.platform }`,
			`       Process Port: ${ process.env.PORT }`,
			`           Site URL: ${ settings.get('Site_Url') }`,
			`   ReplicaSet OpLog: ${ oplogState }`,
		];

		if (Info.commit && Info.commit.hash) {
			msg.push(`        Commit Hash: ${ Info.commit.hash.substr(0, 10) }`);
		}

		if (Info.commit && Info.commit.branch) {
			msg.push(`      Commit Branch: ${ Info.commit.branch }`);
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
