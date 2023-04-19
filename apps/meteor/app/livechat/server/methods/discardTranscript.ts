import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { LivechatRooms } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:discardTranscript'(rid: string): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:discardTranscript'(rid: string) {
		check(rid, String);

		const user = Meteor.userId();

		if (!user || !(await hasPermissionAsync(user, 'send-omnichannel-chat-transcript'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:requestTranscript',
			});
		}

		const room = await LivechatRooms.findOneById(rid);
		if (!room?.open) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'livechat:discardTranscript',
			});
		}

		if (!room.transcriptRequest) {
			throw new Meteor.Error('error-transcript-not-requested', 'No transcript requested for this chat', {
				method: 'livechat:discardTranscript',
			});
		}

		await LivechatRooms.unsetEmailTranscriptRequestedByRoomId(rid);

		return true;
	},
});
