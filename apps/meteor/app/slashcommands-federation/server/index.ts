import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { slashCommands } from '../../utils/lib/slashCommand';
import { federationRoomServiceSender } from '../../federation-v2/server';
import { FederationRoomSenderConverter } from '../../federation-v2/server/infrastructure/rocket-chat/converters/RoomSender';

function Bridge(_command: 'bridge', stringParams: string | undefined, item: Record<string, any>): void {
	if (_command !== 'bridge' || !Match.test(stringParams, String)) {
		return;
	}

	const [command, ...params] = stringParams.split(' ');

	const { rid: roomId } = item;

	switch (command) {
		case 'invite':
			// Invite a user
			// Example: /bridge invite rc_helena:b.rc.allskar.com
			const [userId] = params;

			const currentUserId = Meteor.userId();

			if (currentUserId) {
				const invitee = `@${userId.replace('@', '')}`;
				Promise.await(
					federationRoomServiceSender.inviteUserToAFederatedRoom(
						FederationRoomSenderConverter.toRoomInviteUserDto(currentUserId, roomId, invitee),
					),
				);
			}

			break;
	}
}

slashCommands.add('bridge', Bridge, {
	description: 'Invites_an_user_to_a_bridged_room',
	params: '#command #user',
});
