import { FederationMatrix } from '@rocket.chat/core-services';

import { callbacks } from '../../../../lib/callbacks';

callbacks.add(
	'native-federation.onAddUsersToRoom',
	async ({ invitees, inviter }, room) => FederationMatrix.inviteUsersToRoom(room, invitees, inviter),
	callbacks.priority.MEDIUM,
	'native-federation-on-add-users-to-room ',
);
callbacks.add(
	'native-federation.onAfterAddUsersToRoom',
	async ({ invitees, inviter }, room) => FederationMatrix.inviteUsersToRoom(room, invitees, inviter),
	callbacks.priority.MEDIUM,
	'native-federation-on-after-add-users-to-room ',
);
