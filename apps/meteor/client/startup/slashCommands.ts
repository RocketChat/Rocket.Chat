import type { IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { slashCommands, APIClient } from '../../app/utils/client';

let oldUserId: IUser['_id'] | null = null;

Tracker.autorun(async () => {
	const newUserId = Meteor.userId();
	if (oldUserId === null && newUserId) {
		const result = await APIClient.get('/v1/commands.list', undefined);
		result.commands.forEach((command: { command: string }) => {
			slashCommands.commands[command.command] = command;
		});
	}

	oldUserId = Meteor.userId();
});
