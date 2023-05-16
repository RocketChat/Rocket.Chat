import type { IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { slashCommands } from '../../../app/utils/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';

let oldUserId: IUser['_id'] | null = null;

Tracker.autorun(async () => {
	const newUserId = Meteor.userId();
	if (oldUserId === null && newUserId) {
		sdk.rest.get('/v1/commands.list').then((result) => {
			result.commands.forEach((command) => {
				slashCommands.add(command);
			});
		});
	}

	oldUserId = Meteor.userId();
});
