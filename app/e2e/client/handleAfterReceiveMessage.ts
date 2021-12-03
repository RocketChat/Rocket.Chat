import { e2e } from './rocketchat.e2e';
import { IMessage } from '../../../definition/IMessage';

export const handleAfterReceiveMessage = async (msg: IMessage): Promise<IMessage> => {
	const e2eRoom = await e2e.getInstanceByRoomId(msg.rid);
	if (!e2eRoom || !e2eRoom.shouldConvertReceivedMessages()) {
		return msg;
	}
	return e2e.decryptMessage(msg);
};
