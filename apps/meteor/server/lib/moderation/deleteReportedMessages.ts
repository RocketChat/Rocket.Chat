import type { IUser, IMessage } from '@rocket.chat/core-typings';
import { Messages, Uploads, ReadReceipts } from '@rocket.chat/models';

import { FileUpload } from '../../../app/file-upload/server';
import { settings } from '../../../app/settings/server';

// heavily inspired from message delete taking place in the user deletion process
// in this path we don't care about the apps engine events - it's a "raw" bulk action
export async function deleteReportedMessages(messages: IMessage[], user: IUser): Promise<void> {
	const keepHistory = settings.get('Message_KeepHistory');
	const showDeletedStatus = settings.get('Message_ShowDeletedStatus');
	const files: string[] = [];
	const messageIds: string[] = [];
	for (const message of messages) {
		if (message.file) {
			files.push(message.file._id);
		}
		if (message.files && message.files.length > 0) {
			files.concat(message.files.map((file) => file._id));
		}
		messageIds.push(message._id);
	}
	if (keepHistory) {
		if (showDeletedStatus) {
			const cursor = Messages.find({ _id: { $in: messageIds } });

			for await (const doc of cursor) {
				await Messages.cloneAndSaveAsHistoryByRecord(
					doc,
					user as Required<Pick<IUser, '_id' | 'name'>> & { username: NonNullable<IUser['username']> },
				);
			}
		} else {
			await Messages.setHiddenByIds(messageIds, true);
		}

		await Uploads.updateMany({ _id: { $in: files } }, { $set: { _hidden: true } });
	} else {
		if (!showDeletedStatus) {
			await Messages.deleteMany({ _id: { $in: messageIds } });
		}
		await ReadReceipts.removeByMessageIds(messageIds);

		const store = FileUpload.getStore('Uploads');
		await Promise.all(files.map((file) => store.deleteById(file)));
	}
	if (showDeletedStatus) {
		await Messages.setAsDeletedByIdsAndUser(messageIds, user as any);
	}
}
