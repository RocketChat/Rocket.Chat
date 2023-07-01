import type { IOmnichannelGenericRoom } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';
import { RoomVerificationState } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';
import { initiateVerificationProcess } from '../functions/initiateVerificationProcess';
import { verifyVisitorCode } from '../functions/visitorsVerificationCode';
import { setVisitorEmail } from '../functions/setVisitorsEmail';

callbacks.add(
	'verificationCheck',
	async function (room: IOmnichannelGenericRoom, msg: string) {
		if (room.verificationStatus === 'isListeningToEmail') {
			const result = await setVisitorEmail(room, msg);
			if (result.success) {
				await LivechatRooms.updateVerificationStatusById(room._id, RoomVerificationState.off);
				await initiateVerificationProcess(room._id);
			}
		} else if (room.verificationStatus === 'isListeningToOTP') {
			const result = await verifyVisitorCode(room, msg);
			if (result) {
				await LivechatRooms.updateVerificationStatusById(room._id, RoomVerificationState.off);
			}
		}
	},
	callbacks.priority.HIGH,
	'verificationCheck',
);
