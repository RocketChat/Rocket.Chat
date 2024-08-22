import type { IUser, IRoom, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms, Subscriptions } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import type { CloseRoomParams } from '../../../livechat/server/lib/LivechatTyped';
import { Livechat } from '../../../livechat/server/lib/LivechatTyped';
import { notifyOnSubscriptionChanged } from '../lib/notifyListener';

export const closeLivechatRoom = async (
	user: IUser,
	roomId: IRoom['_id'],
	{
		comment,
		tags,
		generateTranscriptPdf,
		transcriptEmail,
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
	},
): Promise<void> => {
	const room = await LivechatRooms.findOneById(roomId);
	if (!room || !isOmnichannelRoom(room)) {
		throw new Error('error-invalid-room');
	}

	if (!room.open) {
		const { deletedCount } = await Subscriptions.removeByRoomId(roomId, {
			async onTrash(doc) {
				void notifyOnSubscriptionChanged(doc, 'removed');
			},
		});
		if (deletedCount) {
			return;
		}
		throw new Error('error-room-already-closed');
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(roomId, user._id, { projection: { _id: 1 } });
	if (!subscription && !(await hasPermissionAsync(user._id, 'close-others-livechat-room'))) {
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

	await Livechat.closeRoom({
		room,
		user,
		options,
		comment,
	});
};
