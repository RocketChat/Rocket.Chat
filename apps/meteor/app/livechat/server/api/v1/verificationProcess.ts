import { OmnichannelVerification } from '@rocket.chat/core-services';
import { RoomVerificationState } from '@rocket.chat/core-typings';
import { LivechatRooms, Users } from '@rocket.chat/models';

import { i18n } from '../../../../../server/lib/i18n';
import { API } from '../../../../api/server';
import { sendMessage } from '../../../../lib/server/functions/sendMessage';

API.v1.addRoute(
	'livechat/room.verificationStatus',
	{ authRequired: true, permissionsRequired: ['initiate-livechat-verification-process'] },
	{
		async put() {
			const { roomId } = this.bodyParams;
			if (!roomId) {
				throw new Error('invalid-room');
			}

			const room = await LivechatRooms.findOneById(roomId);
			if (!room) {
				throw new Error('error-invalid-room');
			}

			const roomAfterVerificationStateUpdate = await LivechatRooms.updateVerificationStatusById(roomId, RoomVerificationState.unVerified);

			if (!roomAfterVerificationStateUpdate) {
				return API.v1.failure();
			}

			const bot = await Users.findOneById('rocket.cat');
			const message = {
				msg: i18n.t('Visitor_Verification_Process_cancelled'),
				groupable: false,
			};
			await sendMessage(bot, message, room);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'livechat/visitor.verify',
	{ authRequired: true, permissionsRequired: ['initiate-livechat-verification-process'] },
	{
		async post() {
			const { rid } = this.bodyParams;
			await OmnichannelVerification.initiateVerificationProcess(rid);

			return API.v1.success({ rid });
		},
	},
);
