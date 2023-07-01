import type { IOmnichannelGenericRoom } from '@rocket.chat/core-typings';
import { VerificationStatusEnum } from '@rocket.chat/core-typings';
import { LivechatVisitors, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { Accounts } from 'meteor/accounts-base';
import bcrypt from 'bcrypt';

import { settings } from '../../../settings/server';
import { Logger } from '../../../logger/server';
import * as Mailer from '../../../mailer/server/api';
import { i18n } from '../../../../server/lib/i18n';
import { sendMessage } from './sendMessage';

const logger = new Logger('getVerficationCode');

const send2FAEmail = async function (address: string, random: string): Promise<void> {
	const language = settings.get<string>('Language') || 'en';

	const t = (s: string): string => i18n.t(s, { lng: language });
	await Mailer.send({
		to: address,
		from: settings.get('From_Email'),
		subject: 'Authentication code',
		replyTo: undefined,
		data: {
			code: random.replace(/^(\d{3})/, '$1-'),
		},
		headers: undefined,
		text: `
${t('Here_is_your_authentication_code')}

__code__

${t('Do_not_provide_this_code_to_anyone')}
${t('If_you_didnt_try_to_login_in_your_account_please_ignore_this_email')}
`,
		html: `
            <p>${t('Here_is_your_authentication_code')}</p>
            <p style="font-size: 30px;">
                <b>__code__</b>
            </p>
            <p>${t('Do_not_provide_this_code_to_anyone')}</p>
            <p>${t('If_you_didnt_try_to_login_in_your_account_please_ignore_this_email')}</p>
        `,
	});
};

export const sendVerificationCodeToVisitor = async function (visitorId: string): Promise<void> {
	if (!visitorId) {
		throw new Error('error-invalid-user');
	}
	const visitor = await LivechatVisitors.findOneById(visitorId, {});

	if (!visitor) {
		throw new Error('error-invalid-user');
	}

	if (!visitor?.visitorEmails?.length) {
		throw new Error('error-email-required');
	}
	const visitorEmail = visitor.visitorEmails[0].address;
	const random = Random._randomString(6, '0123456789');
	const encryptedRandom = await bcrypt.hash(random, Accounts._bcryptRounds());
	const expire = new Date();
	const expirationInSeconds = parseInt(settings.get('Accounts_TwoFactorAuthentication_By_Email_Code_Expiration') as string, 10);
	expire.setSeconds(expire.getSeconds() + expirationInSeconds);

	await LivechatVisitors.addEmailCodeByVisitorId(visitorId, encryptedRandom, expire);
	await send2FAEmail(visitorEmail, random);
	logger.info(random);
};

export const verifyVisitorCode = async function (room: IOmnichannelGenericRoom, _codeFromVisitor: string): Promise<boolean> {
	const visitorId = room.v._id;
	if (!visitorId) {
		throw new Error('error-invalid-user');
	}

	const visitor = await LivechatVisitors.findOneById(visitorId, {});
	if (!visitor) {
		throw new Error('error-invalid-user');
	}
	if (!visitor.services || !Array.isArray(visitor.services?.emailCode)) {
		return false;
	}

	// Remove non digits
	_codeFromVisitor = _codeFromVisitor.replace(/([^\d])/g, '');

	await LivechatVisitors.removeExpiredEmailCodesOfVisitorId(visitor._id);

	for await (const { code, expire } of visitor.services.emailCode) {
		if (expire < new Date()) {
			continue;
		}

		if (await bcrypt.compare(_codeFromVisitor, code)) {
			await LivechatVisitors.removeEmailCodeByVisitorIdAndCode(visitor._id, code);
			await LivechatVisitors.updateVerificationStatus(visitor._id, VerificationStatusEnum.Verified);
			return true;
		}
	}
	if (!visitor?.wrongMessageCount) {
		await LivechatVisitors.updateWrongMessageCount(visitorId, 1);
	} else if (visitor.wrongMessageCount + 1 >= settings.get('Livechat_LimitWrongAttempts')) {
		await LivechatVisitors.updateVerificationStatus(visitor._id, VerificationStatusEnum.Off);
		await LivechatVisitors.updateWrongMessageCount(visitorId, 0);
	} else {
		await LivechatVisitors.updateWrongMessageCount(visitorId, visitor.wrongMessageCount + 1);
	}
	const bot = await Users.findOneById('rocket.cat');
	const message = {
		msg: i18n.t('Sorry, this is not a valid OTP, kindly provide another input'),
		groupable: false,
	};
	await sendMessage(bot, message, room);

	return false;
};
