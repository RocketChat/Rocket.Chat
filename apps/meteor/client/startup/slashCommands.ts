import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { slashCommands, APIClient } from '../../app/utils/client';
import { IUser } from '../../definition/IUser';

let oldUserId: IUser['_id'] | null = null;

Tracker.autorun(() => {
	const newUserId = Meteor.userId();
	if (oldUserId === null && newUserId) {
		APIClient.v1.get('commands.list').then((result) => {
			result.commands.forEach((command: { command: string }) => {
				slashCommands.commands[command.command] = command;
			});
		});
	}

	oldUserId = Meteor.userId();
});
