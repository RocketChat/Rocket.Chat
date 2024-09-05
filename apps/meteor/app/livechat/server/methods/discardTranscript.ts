import type { ServerMethods } from '@rocket.chat/ddp-client';
import { LivechatRooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:discardTranscript'(rid: string): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:discardTranscript'(rid: string) {
		methodDeprecationLogger.method('livechat:discardTranscript', '7.0.0');
		check(rid, String);
		methodDeprecationLogger.warn(
			'The method "livechat:discardTranscript" is deprecated and will be removed after version v7.0.0. Use "livechat/transcript/:rid" (DELETE) instead.',
		);

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
