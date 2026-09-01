import type { IUser, IRoom, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms, Subscriptions } from '@rocket.chat/models';

import { closeRoom } from './closeRoom';
import type { CloseRoomParams } from './localTypes';
import { hasPermissionAsync } from '../authorization/hasPermission';

export const closeLivechatRoom = async (
	user: IUser,
	roomId: IRoom['_id'],
	{
		comment,
		tags,
		generateTranscriptPdf,
		transcriptEmail,
		forceClose = false,
	}: {
		comment?: string;
		tags?: string[];
		generateTranscriptPdf?: boolean;
		transcriptEmail?:
			| {
					sendToVisitor: false;
			  }
			| {
					sendToVisitor: true;
					requestData: Pick<NonNullable<IOmnichannelRoom['transcriptRequest']>, 'email' | 'subject'>;
			  };
		forceClose?: boolean;
	},
): Promise<void> => {
	const room = await LivechatRooms.findOneById(roomId);
	if (!room) {
		throw new Error('error-invalid-room');
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(roomId, user._id, { projection: { _id: 1 } });
	if (!subscription && !(await hasPermissionAsync(user, 'close-others-livechat-room'))) {
		throw new Error('error-not-authorized');
	}

	const options: CloseRoomParams['options'] = {
		clientAction: true,
		tags,
		...(generateTranscriptPdf && { pdfTranscript: { requestedBy: user._id } }),
		...(transcriptEmail && {
			...(transcriptEmail.sendToVisitor
				? {
						emailTranscript: {
							sendToVisitor: true,
							requestData: {
								email: transcriptEmail.requestData.email,
								subject: transcriptEmail.requestData.subject,
								requestedAt: new Date(),
								requestedBy: user,
							},
						},
					}
				: {
						emailTranscript: {
							sendToVisitor: false,
						},
					}),
		}),
	};

	if (forceClose) {
		return closeRoom({
			room,
			user,
			options,
			comment,
			forceClose,
		});
	}

	if (!room.open) {
		throw new Error('error-room-already-closed');
	}

	return closeRoom({
		room,
		user,
		options,
		comment,
	});
};
