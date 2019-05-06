import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';
import { SystemLogger } from '../../app/logger';
import { settings } from '../../app/settings';
import { Info } from '../../app/utils';
import fs from 'fs';
import path from 'path';
import semver from 'semver';

Meteor.startup(function() {
	const { mongo } = MongoInternals.defaultRemoteCollectionDriver();

	const isOplogEnabled = Boolean(mongo._oplogHandle && mongo._oplogHandle.onOplogEntry);

	let mongoDbVersion;
	let mongoDbEngine;
	try {
		const { version, storageEngine } = Promise.await(mongo.db.command({ serverStatus: 1 }));
		mongoDbVersion = version;
		mongoDbEngine = storageEngine.name;
	} catch (e) {
		mongoDbVersion = 'Error getting version';

		console.error('=== Error getting MongoDB info ===');
		console.error(e && e.toString());
		console.error('----------------------------------');
		console.error('Without mongodb version we can\'t ensure you are running a compatible version.');
		console.error('If you are running your mongodb with auth enabled and an user different from admin');
		console.error('you may need to grant permissions for this user to check cluster data.');
		console.error('You can do it via mongo shell running the following command replacing');
		console.error('the string YOUR_USER by the correct user\'s name:');
		console.error('');
		console.error('   db.runCommand({ grantRolesToUser: "YOUR_USER" , roles: [{role: "clusterMonitor", db: "admin"}]})');
		console.error('');
		console.error('==================================');
	}

	const desiredNodeVersion = semver.clean(fs.readFileSync(path.join(process.cwd(), '../../.node_version.txt')).toString());
	const desiredNodeVersionMajor = String(semver.parse(desiredNodeVersion).major);

	return Meteor.setTimeout(function() {
		let msg = [
			`Rocket.Chat Version: ${ Info.version }`,
			`     NodeJS Version: ${ process.versions.node } - ${ process.arch }`,
			`    MongoDB Version: ${ mongoDbVersion }`,
			`     MongoDB Engine: ${ mongoDbEngine }`,
			`           Platform: ${ process.platform }`,
			`       Process Port: ${ process.env.PORT }`,
			`           Site URL: ${ settings.get('Site_Url') }`,
			`   ReplicaSet OpLog: ${ isOplogEnabled ? 'Enabled' : 'Disabled' }`,
		];

		if (Info.commit && Info.commit.hash) {
			msg.push(`        Commit Hash: ${ Info.commit.hash.substr(0, 10) }`);
		}

		if (Info.commit && Info.commit.branch) {
			msg.push(`      Commit Branch: ${ Info.commit.branch }`);
		}

		msg = msg.join('\n');

		if (!isOplogEnabled) {
			msg += ['', '', 'OPLOG / REPLICASET IS REQUIRED TO RUN ROCKET.CHAT, MORE INFORMATION AT:', 'https://go.rocket.chat/i/oplog-required'].join('\n');
			SystemLogger.error_box(msg, 'SERVER ERROR');

			return process.exit(1);
		}

		if (!semver.satisfies(process.versions.node, desiredNodeVersionMajor)) {
			msg += ['', '', 'YOUR CURRENT NODEJS VERSION IS NOT SUPPORTED,', `PLEASE UPGRADE / DOWNGRADE TO VERSION ${ desiredNodeVersionMajor }.X.X`].join('\n');
			SystemLogger.error_box(msg, 'SERVER ERROR');

			return process.exit(1);
		}

		if (!semver.satisfies(semver.coerce(mongoDbVersion), '>=3.2.0')) {
			msg += ['', '', 'YOUR CURRENT MONGODB VERSION IS NOT SUPPORTED,', 'PLEASE UPGRADE TO VERSION 3.2 OR LATER'].join('\n');
			SystemLogger.error_box(msg, 'SERVER ERROR');

			return process.exit(1);
		}

		return SystemLogger.startup_box(msg, 'SERVER RUNNING');
	}, 100);
});
