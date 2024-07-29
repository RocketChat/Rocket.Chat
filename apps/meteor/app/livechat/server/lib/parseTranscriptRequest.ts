import type { ILivechatVisitor, IOmnichannelRoom, IUser } from '@rocket.chat/core-typings';
import { LivechatVisitors, Users } from '@rocket.chat/models';

import { settings } from '../../../settings/server';
import type { CloseRoomParams } from './localTypes';

export const parseTranscriptRequest = async (
	room: IOmnichannelRoom,
	options: CloseRoomParams['options'],
	visitor?: ILivechatVisitor,
	user?: IUser,
): Promise<CloseRoomParams['options']> => {
	const visitorDecideTranscript = settings.get<boolean>('Livechat_enable_transcript');
	// visitor decides, no changes
	if (visitorDecideTranscript) {
		return options;
	}

	// send always is disabled, no changes
	const sendAlways = settings.get<boolean>('Livechat_transcript_send_always');
	if (!sendAlways) {
		return options;
	}

	const visitorData =
		visitor ||
		(await LivechatVisitors.findOneById<Pick<ILivechatVisitor, 'visitorEmails'>>(room.v._id, { projection: { visitorEmails: 1 } }));
	// no visitor, no changes
	if (!visitorData) {
		return options;
	}
	const visitorEmail = visitorData?.visitorEmails?.[0]?.address;
	// visitor doesnt have email, no changes
	if (!visitorEmail) {
		return options;
	}

	const defOptions = { projection: { _id: 1, username: 1, name: 1 } };
	const requestedBy =
		user ||
		(room.servedBy && (await Users.findOneById(room.servedBy._id, defOptions))) ||
		(await Users.findOneById('rocket.cat', defOptions));

	// no user available for backing request, no changes
	if (!requestedBy) {
		return options;
	}

	return {
		...options,
		emailTranscript: {
			sendToVisitor: true,
			requestData: {
				email: visitorEmail,
				requestedAt: new Date(),
				subject: '',
				requestedBy,
			},
		},
	};
};
