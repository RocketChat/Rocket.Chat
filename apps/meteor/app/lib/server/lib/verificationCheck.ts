import type { IRoom, IMessage } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';
import { RoomVerificationState, isOmnichannelRoom } from '@rocket.chat/core-typings';
import { OmnichannelVerification } from '@rocket.chat/core-services';

import { callbacks } from '../../../../lib/callbacks';
import { setVisitorEmail } from '../functions/setVisitorsEmail';

callbacks.add(
	'afterSaveMessage',
	async function (message: IMessage, room: IRoom) {
		if (isOmnichannelRoom(room)) {
			if (message.u._id === room.v._id) {
				if (room.verificationStatus === 'isListeningToEmail') {
					const result = await setVisitorEmail(room, message.msg);
					if (result.success) {
						await LivechatRooms.updateVerificationStatusById(room._id, RoomVerificationState.off);
						await OmnichannelVerification.initiateVerificationProcess(room._id);
					}
				} else if (room.verificationStatus === 'isListeningToOTP') {
					const result = await OmnichannelVerification.verifyVisitorCode(room, message.msg);
					if (result) {
						await LivechatRooms.updateVerificationStatusById(room._id, RoomVerificationState.off);
					}
				}
			}
		}
	},
	callbacks.priority.HIGH,
	'verificationCheck',
);
