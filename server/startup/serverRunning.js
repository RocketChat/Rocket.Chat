import fs from 'fs';
import path from 'path';
import semver from 'semver';
import { Meteor } from 'meteor/meteor';

import { SystemLogger } from '../../app/logger';
import { settings } from '../../app/settings';
import { Info, getMongoInfo } from '../../app/utils';

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

		return SystemLogger.startup_box(msg, 'SERVER RUNNING');
	}, 100);
});
