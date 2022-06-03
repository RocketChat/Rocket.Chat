import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { slashCommands } from '../../utils/lib/slashCommand';
import { matrixClient } from '../../federation-v2/server/matrix-client';

slashCommands.add(
	'bridge',
	function Bridge(_command, stringParams, item): void {
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
					Promise.await(matrixClient.user.invite(currentUserId, roomId, `@${userId.replace('@', '')}`));
				}

				break;
		}
	},
	{
		description: 'Invites_an_user_to_a_bridged_room',
		params: '#command #user',
	},
);
