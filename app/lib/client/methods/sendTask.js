import { Meteor } from 'meteor/meteor';
import { TimeSync } from 'meteor/mizzao:timesync';
import s from 'underscore.string';
import toastr from 'toastr';

import { ChatTask } from '../../../models';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
import { promises } from '../../../promises/client';
import { t } from '../../../utils/client';

Meteor.methods({
	sendTask(task) {
		if (!Meteor.userId() || s.trim(task.title) === '') {
			return false;
		}
		const taskAlreadyExist = task._id && ChatTask.findOne({ _id: task._id });
		if (taskAlreadyExist) {
			return toastr.error(t('Task_Already_Sent'));
		}
		const user = Meteor.user();

		task.ts = isNaN(TimeSync.serverOffset()) ? new Date() : new Date(Date.now() + TimeSync.serverOffset());
		task.u = {
			_id: Meteor.userId(),
			username: user.username,
		};
		if (settings.get('UI_Use_Real_Name')) {
			task.u.name = user.name;
		}
		task.temp = true;
		if (settings.get('Message_Read_Receipt_Enabled')) {
			task.unread = true;
		}
		task = callbacks.run('beforeSaveMessage', task);
		promises.run('onClientMessageReceived', task).then(function(task) {
			ChatTask.insert(task);
			return callbacks.run('afterSaveTask', task);
		});
	},
});
