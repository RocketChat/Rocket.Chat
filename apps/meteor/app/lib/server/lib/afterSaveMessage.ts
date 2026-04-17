import { Message } from '@rocket.chat/core-services';
import type { IMessage, IUser, IRoom } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { Rooms } from '@rocket.chat/models';

import { callbacks } from '../../../../server/lib/callbacks';
import type { SendMessageOptions } from '../functions/sendMessage';

export async function afterSaveMessage(
	message: IMessage,
	room: IRoom,
	user: IUser,
	{
		roomUpdater,
		options,
	}: {
		roomUpdater?: Updater<IRoom>;
		options?: SendMessageOptions;
	} = {},
): Promise<IMessage> {
	const updater = roomUpdater ?? Rooms.getUpdater();

	const data: IMessage = (await callbacks.run('afterSaveMessage', message, {
		room,
		user,
		roomUpdater: updater,
		options,
	})) as unknown as IMessage;

	if (!roomUpdater && updater.hasChanges()) {
		await Rooms.updateFromUpdater({ _id: room._id }, updater);
	}

	void Message.afterSave({ message: data });

	// TODO: Fix type - callback configuration needs to be updated
	return data;
}

export function afterSaveMessageAsync(
	message: IMessage,
	room: IRoom,
	user: IUser,
	{
		roomUpdater: updater,
		options,
	}: {
		roomUpdater?: Updater<IRoom>;
		options?: SendMessageOptions;
	} = {},
): void {
	const roomUpdater = updater ?? Rooms.getUpdater();

	callbacks.runAsync('afterSaveMessage', message, { room, user, roomUpdater, options });

	if (roomUpdater.hasChanges()) {
		void Rooms.updateFromUpdater({ _id: room._id }, roomUpdater);
	}

	void Message.afterSave({ message });
}
