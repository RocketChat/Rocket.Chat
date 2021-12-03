import { e2e } from './rocketchat.e2e';
import { Rooms } from '../../models/client';
import { IMessage } from '../../../definition/IMessage';
import { waitUntilFind } from '../../../client/lib/utils/waitUntilFind';

export const handleBeforeSendMessage = async (message: IMessage): Promise<IMessage> => {
	const e2eRoom = await e2e.getInstanceByRoomId(message.rid);

	if (!e2eRoom) {
		return message;
	}

	const subscription = await waitUntilFind(() => Rooms.findOne({ _id: message.rid }));

	subscription.encrypted ? e2eRoom.resume() : e2eRoom.pause();

	if (!await e2eRoom.shouldConvertSentMessages()) {
		return message;
	}

	// Should encrypt this message.
	const msg = await e2eRoom.encrypt(message);

	message.msg = msg;
	message.t = 'e2e';
	message.e2e = 'pending';
	return message;
};
