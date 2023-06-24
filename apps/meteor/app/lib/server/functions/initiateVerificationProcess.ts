import { Meteor } from 'meteor/meteor';
import type { IRoom } from '@rocket.chat/core-typings';
import { check } from 'meteor/check';
import { LivechatVisitors, LivechatRooms, Users } from '@rocket.chat/models';

import { sendMessage } from './sendMessage';
import { i18n } from '../../../../server/lib/i18n';
import { sendVerificationCodeToVisitor } from './visitorsVerificationCode';

export const initiateVerificationProcess = async function (rid: IRoom['_id']) {
	check(rid, String);
	const user = await Users.findOneById('rocket.cat');
	const room = await LivechatRooms.findOneById(rid);
	const visitorRoomId = room?.v._id;
	if (!visitorRoomId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { function: 'initiateVerificationProcess' });
	}
	const visitor = await LivechatVisitors.findOneById(visitorRoomId, {});
	if (visitor?.visitorEmails?.length && visitor.visitorEmails[0].address && !visitor?.visitorEmails[0]?.verified) {
		const message = {
			msg: i18n.t(
				'Welcome to the verification process. \n Please enter the OTP (One-Time Password) sent to your email. \n Kindly avoid adding any extra words. Simply reply with the 6-digit OTP, for example, `345678`.',
			),
			groupable: false,
		};
		await sendMessage(user, message, room);
		await sendVerificationCodeToVisitor(visitorRoomId);
		await LivechatRooms.saveRoomById({
			_id: room._id,
			verficationStatus: 'isListeningToOTP',
			topic: '',
			tags: [],
		});
	} else {
		const message = {
			msg: i18n.t(
				'Welcome to the verification process. \n To proceed, please provide your email. Please refrain from adding any additional words except for your email. For example, reply with `xyz@gmail.com` without any other text.',
			),
			groupable: false,
		};
		await sendMessage(user, message, room);
		await LivechatRooms.saveRoomById({
			_id: room._id,
			verficationStatus: 'isListeningToEmail',
			topic: '',
			tags: [],
		});
	}
};
