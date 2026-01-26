import { Message } from '@rocket.chat/core-services';
import type { IMessage, IUser, IRoom } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { Rooms } from '@rocket.chat/models';

import { callbacks } from '../../../../server/lib/callbacks';

export async function afterSaveMessage(message: IMessage, room: IRoom, user: IUser, roomUpdater?: Updater<IRoom>): Promise<IMessage> {
	const updater = roomUpdater ?? Rooms.getUpdater();
	const data: IMessage = (await callbacks.run('afterSaveMessage', message, { room, user, roomUpdater: updater })) as unknown as IMessage;

	if (!roomUpdater && updater.hasChanges()) {
		await Rooms.updateFromUpdater({ _id: room._id }, updater);
	}

	void Message.afterSave({ message: data });

	// TODO: Fix type - callback configuration needs to be updated
	return data;
}

export function afterSaveMessageAsync(message: IMessage, room: IRoom, user: IUser, roomUpdater: Updater<IRoom> = Rooms.getUpdater()): void {
	callbacks.runAsync('afterSaveMessage', message, { room, user, roomUpdater });

	if (roomUpdater.hasChanges()) {
		void Rooms.updateFromUpdater({ _id: room._id }, roomUpdater);
	}

	void Message.afterSave({ message });
}
