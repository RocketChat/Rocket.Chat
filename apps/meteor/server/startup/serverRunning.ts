import fs from 'fs';
import path from 'path';

// import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import semver from 'semver';

import { settings } from '../../app/settings/server';
import { Info } from '../../app/utils/rocketchat.info';
import { getMongoInfo } from '../../app/utils/server/functions/getMongoInfo';
// import { i18n } from '../lib/i18n';
// import { isRunningMs } from '../lib/isRunningMs';
// import { sendMessagesToAdmins } from '../lib/sendMessagesToAdmins';
import { showErrorBox, showSuccessBox } from '../lib/logger/showBox';

const exitIfNotBypassed = (ignore: string | undefined, errorCode = 1) => {
	if (typeof ignore === 'string' && ['yes', 'true'].includes(ignore.toLowerCase())) {
		return;
	}

	process.exit(errorCode);
};

// const skipMongoDbDeprecationCheck = ['yes', 'true'].includes(String(process.env.SKIP_MONGODEPRECATION_CHECK).toLowerCase());
// const skipMongoDbDeprecationBanner = ['yes', 'true'].includes(String(process.env.SKIP_MONGODEPRECATION_BANNER).toLowerCase());

Meteor.startup(async () => {
	const { mongoVersion, mongoStorageEngine } = await getMongoInfo();

	const desiredNodeVersion = semver.clean(fs.readFileSync(path.join(process.cwd(), '../../.node_version.txt')).toString());
	const parsedSemVer = semver.parse(desiredNodeVersion);
	if (!parsedSemVer) {
		console.error('Failed to parse desired Node.js version from .node_version.txt');
		process.exit(1);
	}

	const desiredNodeVersionMajor = String(parsedSemVer.major);

	return setTimeout(async () => {
		let msg: string | string[] = [
			`Rocket.Chat Version: ${Info.version}`,
			`     NodeJS Version: ${process.versions.node} - ${process.arch}`,
			`    MongoDB Version: ${mongoVersion}`,
			`     MongoDB Engine: ${mongoStorageEngine}`,
			`           Platform: ${process.platform}`,
			`       Process Port: ${process.env.PORT}`,
			`           Site URL: ${settings.get('Site_Url')}`,
		];

		if (Info.commit?.hash) {
			msg.push(`        Commit Hash: ${Info.commit.hash.substr(0, 10)}`);
		}

		if (Info.commit?.branch) {
			msg.push(`      Commit Branch: ${Info.commit.branch}`);
		}

		msg = msg.join('\n');

		if (!semver.satisfies(process.versions.node, desiredNodeVersionMajor)) {
			msg += [
				'',
				'',
				'YOUR CURRENT NODEJS VERSION IS NOT SUPPORTED,',
				`PLEASE UPGRADE / DOWNGRADE TO VERSION ${desiredNodeVersionMajor}.X.X`,
			].join('\n');
			showErrorBox('SERVER ERROR', msg);

			exitIfNotBypassed(process.env.BYPASS_NODEJS_VALIDATION);
		}

		const mongoSemver = semver.coerce(mongoVersion);

		if (!mongoSemver || semver.satisfies(mongoSemver, '<7.0.0')) {
			msg += ['', '', 'YOUR CURRENT MONGODB VERSION IS NOT SUPPORTED BY ROCKET.CHAT,', 'PLEASE UPGRADE TO VERSION 7.0 OR LATER'].join('\n');
			showErrorBox('SERVER ERROR', msg);

			exitIfNotBypassed(process.env.BYPASS_MONGO_VALIDATION);
		}

		showSuccessBox('SERVER RUNNING', msg);

		// Deprecation
		// if (!skipMongoDbDeprecationCheck && semver.satisfies(semver.coerce(mongoVersion), '<7.0.0')) {
		// 	msg = [
		// 		`YOUR CURRENT MONGODB VERSION (${mongoVersion}) IS DEPRECATED.`,
		// 		'IT WILL NOT BE SUPPORTED ON ROCKET.CHAT VERSION 8.0.0 AND GREATER,',
		// 		'PLEASE UPGRADE MONGODB TO VERSION 6.0 OR GREATER',
		// 	].join('\n');
		// 	showWarningBox('DEPRECATION', msg);

		// 	const id = `mongodbDeprecation_${mongoVersion.replace(/[^0-9]/g, '_')}`;
		// 	const title = 'MongoDB_Deprecated';
		// 	const text = 'MongoDB_version_s_is_deprecated_please_upgrade_your_installation';
		// 	const link = 'https://go.rocket.chat/i/mongodb-deprecated';

		// 	if (!(await Users.bannerExistsById(id))) {
		// 		if (skipMongoDbDeprecationBanner || process.env.TEST_MODE) {
		// 			return;
		// 		}
		// 		sendMessagesToAdmins({
		// 			msgs: async ({ adminUser }) => [
		// 				{
		// 					msg: `*${i18n.t(title, adminUser.language)}*\n${i18n.t(text, { postProcess: 'sprintf', sprintf: [mongoVersion] }, adminUser.language)}\n${link}`,
		// 				},
		// 			],
		// 			banners: [
		// 				{
		// 					id,
		// 					priority: 100,
		// 					title,
		// 					text,
		// 					textArguments: [mongoVersion],
		// 					modifiers: ['danger'],
		// 					link,
		// 				},
		// 			],
		// 		});
		// 	}
		// }
	}, 100);
});
