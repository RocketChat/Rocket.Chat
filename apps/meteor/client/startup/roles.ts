import type { IRole } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { Roles } from '../../app/models/client';
import { CachedCollectionManager } from '../../app/ui-cached-collection/client';
import { sdk } from '../../app/utils/client/lib/SDKClient';

Meteor.startup(() => {
	CachedCollectionManager.onLogin(async () => {
		const { roles } = await sdk.rest.get('/v1/roles.list');
		// if a role is checked before this collection is populated, it will return undefined
		Roles._collection._docs._map = new Map(roles.map((record) => [Roles._collection._docs._idStringify(record._id), record]));
		Object.values(Roles._collection.queries).forEach((query) => Roles._collection._recomputeResults(query));

		Roles.ready.set(true);
	});

	type ClientAction = 'inserted' | 'updated' | 'removed' | 'changed';

	const events: Record<string, ((role: IRole & { type?: ClientAction }) => void) | undefined> = {
		changed: async (role) => {
			delete role.type;
			await Roles.upsertAsync({ _id: role._id }, role);
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
