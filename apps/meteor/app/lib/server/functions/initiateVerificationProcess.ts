import type { IRoom } from '@rocket.chat/core-typings';
import { RoomVerificationState } from '@rocket.chat/core-typings';
import { check } from 'meteor/check';
import { LivechatVisitors, LivechatRooms, Users } from '@rocket.chat/models';

import { sendMessage } from './sendMessage';
import { i18n } from '../../../../server/lib/i18n';
import { sendVerificationCodeToVisitor } from './visitorsVerificationCode';

export const initiateVerificationProcess = async function (rid: IRoom['_id']) {
	check(rid, String);
	const room = await LivechatRooms.findOneById(rid);
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
		await sendVerificationCodeToVisitor(visitorRoomId);
		await LivechatRooms.updateVerificationStatusById(room._id, RoomVerificationState.isListeningToOTP);
	} else {
		const message = {
			msg: i18n.t('Email_Entry_Instructions_for_Visitor_Verification_Process'),
			groupable: false,
		};
		await sendMessage(user, message, room);
		await LivechatRooms.updateVerificationStatusById(room._id, RoomVerificationState.isListeningToEmail);
	}
};
