import { Meteor } from 'meteor/meteor';
import type { IRoom } from '@rocket.chat/core-typings';
import { check } from 'meteor/check';
import { LivechatVisitors, LivechatRooms, Users } from '@rocket.chat/models';

import { sendMessage } from './sendMessage';
import { i18n } from '../../../../server/lib/i18n';

export const verifyVisitor = async function (rid: IRoom['_id']) {
	check(rid, String);
	const user = await Users.findOneById('rocket.cat');
	const room = await LivechatRooms.findOneById(rid);
	const visitorRoomId = room?.v._id;
	if (!visitorRoomId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { function: 'verifyVisitor' });
	}
	const visitor = await LivechatVisitors.findOneById(visitorRoomId, {});
	if (visitor?.visitorEmails?.length && visitor.visitorEmails[0].address) {
		console.log(visitor.visitorEmails[0].address);
		const message = {
			msg: i18n.t(
				'Verification prcess started \n Kindly enter te OTP sent to your email \n Dont add any other word except your 6-digit OTP like `My OTP is 345678` Just reply with `345678`',
			),
			groupable: false,
		};
		await sendMessage(user, message, room);
		await LivechatRooms.saveRoomById({
			_id: room._id,
			verficationStatus: 'isListeningToOTP',
			topic: '',
			tags: [],
		});
	} else {
		const message = {
			msg: i18n.t(
				'Verification prcess started \n Kindly provide your email \n Dont add any other word except your email like `My email is xyz@gmail.com` Just reply with xyz@gmail.com',
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
