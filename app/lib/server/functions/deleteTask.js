import { FileUpload } from '../../../file-upload/server';
import { settings } from '../../../settings/server';
import { Tasks, Uploads, Rooms } from '../../../models/server';
import { Notifications } from '../../../notifications/server';
import { callbacks } from '../../../callbacks';

export const deleteTask = function(task, user) {
	const deletedTask = Tasks.findOneById(task._id);
	const keepHistory = settings.get('Message_KeepHistory');
	const showDeletedStatus = settings.get('Message_ShowDeletedStatus');

	// if (deletedTask && Apps && Apps.isLoaded()) {
	// 	const prevent = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageDeletePrevent', deletedTask));
	// 	if (prevent) {
	// 		throw new Meteor.Error('error-app-prevented-deleting', 'A Rocket.Chat App prevented the task deleting.');
	// 	}
	// }

	if (deletedTask.tmid) {
		Tasks.decreaseReplyCountById(deletedTask.tmid, -1);
	}

	if (keepHistory) {
		if (showDeletedStatus) {
			Tasks.cloneAndSaveAsHistoryById(task._id, user);
		} else {
			Tasks.setHiddenById(task._id, true);
		}

		if (task.file && task.file._id) {
			Uploads.update(task.file._id, { $set: { _hidden: true } });
		}
	} else {
		if (!showDeletedStatus) {
			Tasks.removeById(task._id);
		}

		if (task.file && task.file._id) {
			FileUpload.getStore('Uploads').deleteById(task.file._id);
		}
	}

	const room = Rooms.findOneById(task.rid, { fields: { lastMessage: 1, prid: 1, mid: 1 } });
	callbacks.run('afterDeleteMessage', deletedTask, room, user);

	if (settings.get('Store_Last_Message')) {
		if (!room.lastMessage || room.lastMessage._id === task._id) {
			Rooms.resetLastTaskById(task.rid, task._id);
		}
	}

	// decrease task count
	Rooms.decreaseMessageCountById(task.rid, 1);

	if (showDeletedStatus) {
		Tasks.setAsDeletedByIdAndUser(task._id, user);
	} else {
		Notifications.notifyRoom(task.rid, 'deleteTask', { _id: task._id });
	}

	// if (Apps && Apps.isLoaded()) {
	// 	Apps.getBridges().getListenerBridge().messageEvent('IPostMessageDeleted', deletedTask);
	// }
};
