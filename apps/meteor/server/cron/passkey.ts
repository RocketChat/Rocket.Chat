import { cronJobs } from '@rocket.chat/cron';
import { Users } from '@rocket.chat/models';
import { UAParser } from 'ua-parser-js';
import { UAParserDesktop, UAParserMobile } from '/app/statistics/server/lib/UAParserCustom';
import { settings } from '/app/settings/server';
import { i18n } from '/app/utils/lib/i18n';
import * as Mailer from '/app/mailer/server/api';
import { Accounts } from 'meteor/accounts-base';

export async function passkeyCron(): Promise<void> {
	return cronJobs.add('Passkey', '0 3 * * *', async () => {
		const result = await Users.findExpiredPasskeys(120);
		await Promise.all(
			result.map(async (user) => {
				await Promise.all(
					user.passkeys.map(async (passkey) => {
						await Users.deletePasskey(user._id, passkey.id);
					}),
				);
				await sendPasskeyChangeEmail(user);
			}),
		);
	});
}

// TODO fzh075 arrow function?
const sendPasskeyChangeEmail = async (user) => {
	// TODO fzh075 setting
	// const deviceEnabled = settings.get('Device_Management_Enable_Login_Emails');
	// if (!deviceEnabled) {
	// 	return;
	// }

	if (!user?.emails?.length) {
		return;
	}

	// const userReceiveLoginEmailPreference =
	// 	!settings.get('Device_Management_Allow_Login_Email_preference') ||
	// 	(await getUserPreference(userId, 'receiveLoginDetectionEmail', true));
	// if (!userReceiveLoginEmailPreference) {
	// 	return;
	// }

	const language = user.language || settings.get('Language') || 'en';
	const t = i18n.getFixedT(language);

	const {
		name,
		username,
		emails: [{ address: email }],
	} = user;

	const mailData = {
		name,
		username,
	};

	const html = `
			<h2 class="rc-color">{Automatic_Deletion}</h2>
			<p>
				{Hello} <strong>[name] ([username])</strong>
				<p>{Some_of_your_passkeys_have_been_automatically_deleted_due_to_prolonged_inactivity.}</p>
			</p>
			<p>{Thank_You_For_Choosing_RocketChat}</p>
			`;

	try {
		await Mailer.send({
			to: `${name} <${email}>`,
			from: Accounts.emailTemplates.from,
			subject: t('Automatic_Deletion_Of_Passkeys'),
			html,
			data: mailData,
		});
	} catch (error) {
		console.error('Error sending passkey security alert email:', error);
	}

	// Mailer.send({
	// 	to: user.emails[0].address,
	// 	from: settings.get('From_Email'),
	// 	subject: settings.get('Passkey_Added_Email_Subject'),
	// 	html: settings.get('Passkey_Added_Email_Body'),
	// 	data: {
	// 		name: user.name,
	// 		username: user.username,
	// 		// ipInfo: clientIp,
	// 		date: moment().format(settings.get('Message_TimeAndDateFormat')),
	// 		// osInfo: ...
	// 	},
	// });
};
