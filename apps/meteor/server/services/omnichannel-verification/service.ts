import type { IRoom, IOmnichannelGenericRoom } from '@rocket.chat/core-typings';
import { VerificationStatusEnum, RoomVerificationState } from '@rocket.chat/core-typings';
import { check } from 'meteor/check';
import type { IOmnichannelVerification, ISetVisitorEmailResult } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import { LivechatVisitors, LivechatRooms, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { Accounts } from 'meteor/accounts-base';
import bcrypt from 'bcrypt';

import { sendMessage } from '../../../app/lib/server/functions/sendMessage';
import { i18n } from '../../lib/i18n';
import { settings } from '../../../app/settings/server';
import { Logger } from '../../../app/logger/server';
import * as Mailer from '../../../app/mailer/server/api';
import { validateEmailDomain } from '../../../app/lib/server/lib';
import { checkEmailAvailability } from '../../../app/lib/server/functions';


interface RandomOTP {
	random: string;
	encryptedRandom: string;
	expire: Date;
}
export class OmnichannelVerification extends ServiceClassInternal implements IOmnichannelVerification {
	protected name = 'omnichannel-verification';

	private logger: Logger;

	constructor() {
		super();
		this.logger = new Logger('GetVerficationCode');
	}

	private async send2FAEmail(address: string, random: string): Promise<void> {
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
	}

	private async generateRandomOTP(): Promise<RandomOTP> {
		const random = Random._randomString(6, '0123456789');
		const encryptedRandom = await bcrypt.hash(random, Accounts._bcryptRounds());
		const expire = new Date();
		const expirationInSeconds = parseInt(settings.get('Accounts_TwoFactorAuthentication_By_Email_Code_Expiration') as string, 10);
		expire.setSeconds(expire.getSeconds() + expirationInSeconds);
		return { random, encryptedRandom, expire };
	}

	private async sendVerificationCodeToVisitor(visitorId: string): Promise<void> {
		if (!visitorId) {
			throw new Error('error-invalid-user');
		}
		const visitor = await LivechatVisitors.findOneById(visitorId, {
			projection: {
				visitorEmails: 1,
			},
		});

		if (!visitor) {
			throw new Error('error-invalid-user');
		}

		if (!visitor?.visitorEmails?.length) {
			throw new Error('error-email-required');
		}
		const visitorEmail = visitor.visitorEmails[0].address;
		const { random, encryptedRandom, expire } = await this.generateRandomOTP();
		await LivechatVisitors.addEmailCodeByVisitorId(visitorId, encryptedRandom, expire);
		await this.send2FAEmail(visitorEmail, random);
	}

	async verifyVisitorCode(room: IOmnichannelGenericRoom, _codeFromVisitor: string): Promise<boolean> {
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
			await Promise.all([
				LivechatVisitors.updateVerificationStatus(visitor._id, VerificationStatusEnum.Off);
				LivechatVisitors.updateWrongMessageCount(visitorId, 0);
				LivechatRooms.updateVerificationStatusById(room._id, RoomVerificationState.verifiedFalse);
			]);
			return false;
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
	}

	async initiateVerificationProcess(rid: IRoom['_id']) {
		check(rid, String);
		const room = await LivechatRooms.findOneById(rid);
		if (room?.verificationStatus !== 'unVerified') {
			return;
		}
		const visitorRoomId = room?.v._id;
		if (!visitorRoomId) {
			throw new Error('error-invalid-user');
		}
		const visitor = await LivechatVisitors.findOneById(visitorRoomId, { projection: { visitorEmails: 1 } });
		if (visitor?.visitorEmails?.length && visitor?.visitorEmails[0]?.verified === 'Verified') {
			return;
		}
		const user = await Users.findOneById('rocket.cat');
		if (visitor?.visitorEmails?.length && visitor.visitorEmails[0].address) {
			const message = {
				msg: i18n.t('OTP_Entry_Instructions_for_Visitor_Verification_Process'),
				groupable: false,
			};
			await sendMessage(user, message, room);
			await this.sendVerificationCodeToVisitor(visitorRoomId);
			await LivechatRooms.updateVerificationStatusById(room._id, RoomVerificationState.isListeningToOTP);
		} else {
			const message = {
				msg: i18n.t('Email_Entry_Instructions_for_Visitor_Verification_Process'),
				groupable: false,
			};
			await sendMessage(user, message, room);
			await LivechatRooms.updateVerificationStatusById(room._id, RoomVerificationState.isListeningToEmail);
		}
	}

	async setVisitorEmail(room: IOmnichannelGenericRoom, email: string): Promise<ISetVisitorEmailResult>{
		try {
			const userId = room.v._id;
			const bot = await Users.findOneById('rocket.cat');
			email = email.trim();
			if (!userId) {
				throw new Error('error-invalid-user');
			}
	
			if (!email) {
				throw new Error('error-email-required');
			}
	
			try {
				await validateEmailDomain(email);
			} catch (error) {
				const message = {
					msg: i18n.t('Sorry, this is not a valid email, kindly provide another input'),
					groupable: false,
				};
				await sendMessage(bot, message, room);
				return { success: false, error: error as Error };
			}
	
			const visitor = await LivechatVisitors.findOneById(userId, {});
			if (!visitor) {
				throw new Error('error-invalid-user');
			}
	
			// User already has desired email, return
			if (visitor?.visitorEmails?.length && visitor.visitorEmails[0].address === email) {
				return { success: true };
			}
	
			// Check email availability
			if (!(await checkEmailAvailability(email))) {
				throw new Error('error-email-unavailable');
			}
	
			// Set new email
			const updateVisitor = {
				$set: {
					visitorEmails: [
						{
							address: email,
						},
					],
				},
			};
			await LivechatVisitors.updateById(userId, updateVisitor);
			const result = {
				success: true,
			};
			return result;
		} catch (error) {
			this.logger.error({ msg: 'Failed to update email :', error });
			return { success: false, error: error as Error };
		}
	}
}
