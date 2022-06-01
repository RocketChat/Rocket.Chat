import type { IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { slashCommands, APIClient } from '../../app/utils/client';

let oldUserId: IUser['_id'] | null = null;

Tracker.autorun(() => {
	const newUserId = Meteor.userId();
	if (oldUserId === null && newUserId) {
		APIClient.v1.get('commands.list').then((result) => {
			result.commands.forEach((command: typeof slashCommands.commands[string]) => {
				slashCommands.commands[command.command] = command;
			});
		});
	}

	oldUserId = Meteor.userId();
});
