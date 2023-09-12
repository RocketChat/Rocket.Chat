import { OmnichannelVerification } from '@rocket.chat/core-services';
import { RoomVerificationState, isOmnichannelRoom } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server';

callbacks.add(
	'afterSaveMessage',
	async (message, room) => {
		if (!(isOmnichannelRoom(room) && room.v.token)) {
			return message;
		}
		if (message.t) {
			return message;
		}
		if (!message.token) {
			return message;
		}
		if (
			room.verificationStatus === RoomVerificationState.unVerified &&
			settings.get('Livechat_automate_verification_process') &&
			settings.get('Livechat_verificaion_bot_assign') === room.servedBy?.username
		) {
			await OmnichannelVerification.initiateVerificationProcess(room._id);
		}
	},
	callbacks.priority.LOW,
	'automate-verification-process',
);
