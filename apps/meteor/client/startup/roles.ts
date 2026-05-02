import type { IRole } from '@rocket.chat/core-typings';

import { sdk } from '../../app/utils/client/lib/SDKClient';
import { onLoggedIn } from '../lib/loggedIn';
import { userIdStore } from '../lib/user';
import { Roles } from '../stores';

onLoggedIn(async () => {
	const { roles } = await sdk.rest.get('/v1/roles.list');
	// if a role is checked before this collection is populated, it will return undefined
	Roles.state.replaceAll(roles);
});

type ClientAction = 'inserted' | 'updated' | 'removed' | 'changed';

const events: Record<string, ((role: IRole & { type?: ClientAction }) => void) | undefined> = {
	changed: (role) => {
		delete role.type;
		Roles.state.store(role);
	},
	removed: (role) => {
		Roles.state.delete(role._id);
	},
};

const subscribeToRolesStream = () => {
	sdk.stream('roles', ['roles'], (role) => {
		events[role.type]?.(role);
	});
};

if (userIdStore.getState()) {
	subscribeToRolesStream();
} else {
	const unsubscribe = userIdStore.subscribe((uid) => {
		if (!uid) return;
		unsubscribe();
		subscribeToRolesStream();
	});
}
