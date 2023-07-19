import type { IRoom, IMessage } from '@rocket.chat/core-typings';
import { LivechatRooms, Users } from '@rocket.chat/models';
import { RoomVerificationState, isOmnichannelRoom } from '@rocket.chat/core-typings';
import { OmnichannelVerification } from '@rocket.chat/core-services';

import { callbacks } from '../../../../lib/callbacks';
import { i18n } from '../../../../server/lib/i18n';
import { sendMessage } from '../functions/sendMessage';

callbacks.add(
	'afterSaveMessage',
	async function (message: IMessage, room: IRoom) {
		if (!isOmnichannelRoom(room)) {
			return;
		}

		if (message.u._id !== room.v._id) {
			return;
		}
		if (room.verificationStatus === RoomVerificationState.isListeningToEmail) {
			const result = await OmnichannelVerification.setVisitorEmail(room, message.msg);
			if (result.success) {
				await LivechatRooms.updateVerificationStatusById(room._id, RoomVerificationState.unVerified);
				await OmnichannelVerification.initiateVerificationProcess(room._id);
			}
		} else if (room.verificationStatus === RoomVerificationState.isListeningToOTP) {
			const result = await OmnichannelVerification.verifyVisitorCode(room, message.msg);
			if (result) {
				await LivechatRooms.updateVerificationStatusById(room._id, RoomVerificationState.verified);
				const bot = await Users.findOneById('rocket.cat');
				const message = {
					msg: i18n.t('Visitor_Verification_Process_Completed'),
					groupable: false,
				};
				await sendMessage(bot, message, room);
			}
		}
	},
	callbacks.priority.HIGH,
	'verificationCheck',
);
