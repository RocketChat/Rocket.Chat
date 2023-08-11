import { RoomVerificationState } from '@rocket.chat/core-typings';
import type { IRoom, IMessage, IOmnichannelGenericRoom, IOmnichannelRoom } from '@rocket.chat/core-typings';
import type { MessageSurfaceLayout } from '@rocket.chat/ui-kit';
import { check } from 'meteor/check';
import type { IOmnichannelVerification, ISetVisitorEmailResult } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import { LivechatVisitors, LivechatRooms, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { Accounts } from 'meteor/accounts-base';
import bcrypt from 'bcrypt';

import { sendMessage } from '../../../app/lib/server/functions/sendMessage';
import { Livechat as LivechatTyped } from '../../../app/livechat/server/lib/LivechatTyped';
import { i18n } from '../../lib/i18n';
import { settings } from '../../../app/settings/server';
import { Logger } from '../../../app/logger/server';
import * as Mailer from '../../../app/mailer/server/api';
import { validateEmailDomain } from '../../../app/lib/server/lib';
import { checkEmailAvailability } from '../../../app/lib/server/functions';

interface IRandomOTP {
	random: string;
	encryptedRandom: string;
	expire: Date;
}
export class OmnichannelVerification extends ServiceClassInternal implements IOmnichannelVerification {
	protected name = 'omnichannel-verification';

	private logger: Logger;

	constructor() {
		super();
		this.logger = new Logger('Omni-Verification');
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

	private async wrongInput(room: IOmnichannelRoom, _isWrongOTP: boolean): Promise<boolean> {
		const limitWrongAttempts: number = settings?.get('Livechat_LimitWrongAttempts') ?? 3;
		if (!room?.wrongMessageCount) {
			await LivechatRooms.updateWrongMessageCount(room._id, 1);
			return true;
		}
		if (room.wrongMessageCount + 1 >= limitWrongAttempts) {
			const { emailCode } = room.services || {};
			await Promise.all([
				LivechatRooms.updateWrongMessageCount(room._id, 0),
				LivechatRooms.updateVerificationStatusById(room._id, RoomVerificationState.verifiedFalse),
				emailCode && _isWrongOTP
					? Promise.all(emailCode.map(({ code }) => LivechatRooms.removeEmailCodeByRoomIdAndCode(room._id, code)))
					: Promise.resolve(),
				// eslint-disable-next-line no-constant-condition
				room?.servedBy?._id || 'rocket.cat'
					? sendMessage(
							await Users.findOneById('rocket.cat'),
							{ msg: i18n.t('Visitor_Verification_Process_failed'), groupable: false },
							room,
					  )
					: Promise.resolve(),
			]);

			const comment = 'Chat closed due to multiple invalid input';
			const userId = room?.servedBy?._id || 'rocket.cat';
			const user = await Users.findOneById(userId);
			await LivechatTyped.closeRoom({ user, room, comment });
			return false;
		}
		await LivechatRooms.updateWrongMessageCount(room._id, room.wrongMessageCount + 1);
		return true;
	}

	private async generateRandomOTP(): Promise<IRandomOTP> {
		const random = Random._randomString(6, '0123456789');
		const encryptedRandom = await bcrypt.hash(random, Accounts._bcryptRounds());
		const expire = new Date();
		const expirationInSeconds = parseInt(settings.get('Accounts_TwoFactorAuthentication_By_Email_Code_Expiration') as string, 10);
		expire.setSeconds(expire.getSeconds() + expirationInSeconds);
		return { random, encryptedRandom, expire };
	}

	async sendVerificationCodeToVisitor(visitorId: string, room: IOmnichannelGenericRoom): Promise<void> {
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
		this.logger.info(random);
		await LivechatRooms.addEmailCodeByRoomId(room._id, encryptedRandom, expire);
		await this.send2FAEmail(visitorEmail, random);
	}

	async verifyVisitorCode(room: IOmnichannelRoom, _codeFromVisitor: string): Promise<boolean> {
		if (!room.services || !Array.isArray(room.services?.emailCode)) {
			return false;
		}

		// Remove non digits
		_codeFromVisitor = _codeFromVisitor.replace(/([^\d])/g, '');

		await LivechatRooms.removeExpiredEmailCodesOfRoomId(room._id);

		for await (const { code, expire } of room.services.emailCode) {
			if (expire < new Date()) {
				await LivechatRooms.removeEmailCodeByRoomIdAndCode(room._id, code);
				continue;
			}

			if (await bcrypt.compare(_codeFromVisitor, code)) {
				await Promise.all([
					LivechatRooms.removeEmailCodeByRoomIdAndCode(room._id, code),
					LivechatRooms.updateWrongMessageCount(room._id, 0),
				]);
				return true;
			}
		}
		const result = await this.wrongInput(room, true);
		if (result) {
			const text = i18n.t('Wrong_OTP_Input_Message');
			await this.createLivechatMessage(room, text);
		}
		return false;
	}

	private async createMessage(room: IOmnichannelRoom, customBlocks?: IMessage['blocks']): Promise<IMessage['_id']> {
		const record = {
			msg: '',
			groupable: false,
			blocks: customBlocks,
		};
		const user = await Users.findOneById('rocket.cat');
		const message = await sendMessage(user, record, room, false);
		return message._id;
	}

	private async createLivechatMessage(room: IOmnichannelRoom, text: string): Promise<IMessage['_id']> {
		return this.createMessage(room, [
			this.buildMessageBlock(text),
			{
				type: 'actions',
				appId: 'visitor_verification_OTP',
				blockId: room._id,
				elements: [
					{
						appId: 'visitor_verification_OTP',
						blockId: room._id,
						actionId: 'joinLivechat',
						type: 'button',
						text: {
							type: 'plain_text',
							text: 'Resend OTP',
							emoji: true,
						},
						style: 'primary',
					},
				],
			},
		]);
	}

	private buildMessageBlock(text: string): MessageSurfaceLayout[number] {
		return {
			type: 'section',
			appId: 'visitor_verification_OTP',
			text: {
				type: 'mrkdwn',
				text: `${text}`,
			},
		};
	}

	async initiateVerificationProcess(rid: IRoom['_id']) {
		try {
			check(rid, String);
			const room = await LivechatRooms.findOneById(rid);
			if (room?.verificationStatus !== 'unVerified') {
				return;
			}
			const { _id: visitorRoomId } = room.v;
			if (!visitorRoomId) {
				throw new Error('error-invalid-user');
			}
			const visitor = await LivechatVisitors.findOneById(visitorRoomId, { projection: { visitorEmails: 1 } });
			const user = await Users.findOneById('rocket.cat');
			if (visitor?.visitorEmails?.length && visitor.visitorEmails[0].address) {
				const otpInstructionsText = i18n.t('OTP_Entry_Instructions_for_Visitor_Verification_Process');
				await this.createLivechatMessage(room, otpInstructionsText);
				await this.sendVerificationCodeToVisitor(visitorRoomId, room);
				await LivechatRooms.updateVerificationStatusById(room._id, RoomVerificationState.isListeningToOTP);
			} else {
				const emailInstructionsMessage = {
					msg: i18n.t('Email_Entry_Instructions_for_Visitor_Verification_Process'),
					groupable: false,
				};
				await sendMessage(user, emailInstructionsMessage, room);
				await LivechatRooms.updateVerificationStatusById(room._id, RoomVerificationState.isListeningToEmail);
			}
		} catch (error) {
			this.logger.error({ msg: 'Failed to initiate verification process:', error });
		}
	}

	async setVisitorEmail(room: IOmnichannelRoom, email: string): Promise<ISetVisitorEmailResult> {
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
				const result = await this.wrongInput(room, false);
				if (result) {
					const message = {
						msg: i18n.t('Wrong_Email_Input_Message'),
						groupable: false,
					};
					await sendMessage(bot, message, room);
				}
				return { success: false, error: error as Error };
			}

			const visitor = await LivechatVisitors.findOneById(userId, {
				projection: {
					visitorEmails: 1,
				},
			});
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
			await LivechatRooms.updateWrongMessageCount(room._id, 0);
			return { success: true };
		} catch (error) {
			this.logger.error({ msg: 'Failed to update email :', error });
			return { success: false, error: error as Error };
		}
	}
}
