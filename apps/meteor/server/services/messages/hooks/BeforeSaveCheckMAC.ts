import { MeteorError, Omnichannel } from '@rocket.chat/core-services';
import type { IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom, type IMessage } from '@rocket.chat/core-typings';

export class BeforeSaveCheckMAC {
	async isWithinLimits({ message, room }: { message: IMessage; room: IRoom }): Promise<void> {
		if (!isOmnichannelRoom(room)) {
			return;
		}

		if (message.token) {
			return;
		}

		if (message.t) {
			return;
		}

		const canSendMessage = await Omnichannel.isWithinMACLimit(room);
		if (!canSendMessage) {
			throw new MeteorError('error-mac-limit-reached');
		}
	}
}
