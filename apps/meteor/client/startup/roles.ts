import type { IRole } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { Roles } from '../../app/models/client';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { onLoggedIn } from '../lib/loggedIn';

Meteor.startup(() => {
	onLoggedIn(async () => {
		const { roles } = await sdk.rest.get('/v1/roles.list');
		// if a role is checked before this collection is populated, it will return undefined
		Roles.state.replaceAll(roles);

		Roles.ready.set(true);
	});

	type ClientAction = 'inserted' | 'updated' | 'removed' | 'changed';

	const events: Record<string, ((role: IRole & { type?: ClientAction }) => void) | undefined> = {
		changed: (role) => {
			delete role.type;
			Roles.upsert({ _id: role._id }, role);
		},
		removed: (role) => {
			Roles.remove({ _id: role._id });
		},
	};

	Tracker.autorun((c) => {
		if (!Meteor.userId()) {
			return;
		}

		Tracker.afterFlush(() => {
			sdk.stream('roles', ['roles'], (role) => {
				events[role.type]?.(role);
			});
		});

		c.stop();
	});
});
