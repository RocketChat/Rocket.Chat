import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { OmnichannelSourceType } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { Livechat } from '../lib/Livechat';
import { settings } from '../../../settings/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		sendMessageLivechat(
			message: {
				token: string;
				_id: string;
				rid: string;
				msg: string;
				file?: {
					_id: string;
					name: string;
					type: string;
					size: number;
					description: string;
					identify: { size: { width: number; height: number } };
				};
				attachments?: {
					title: string;
					title_link: string;
					title_link_download: boolean;
					description: string;
					image_url: string;
					audio_url: string;
					video_url: string;
					actions: {
						type: string;
						text: string;
						url: string;
						msg: string;
						msg_in_chat_window: boolean;
						msg_processing_type: string;
					}[];
				};
			},
			agent?: {
				agentId: string;
				username: string;
			},
		): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async sendMessageLivechat({ token, _id, rid, msg, file, attachments }, agent) {
		check(token, String);
		check(_id, String);
		check(rid, String);
		check(msg, String);

		check(
			agent,
			Match.Maybe({
				agentId: String,
				username: String,
			}),
		);

		const guest = await LivechatVisitors.getVisitorByToken(token, {
			projection: {
				name: 1,
				username: 1,
				department: 1,
				token: 1,
			},
		});

		if (!guest) {
			throw new Meteor.Error('invalid-token');
		}

		if (
			settings.get('Livechat_enable_message_character_limit') &&
			msg.length > parseInt(settings.get('Livechat_message_character_limit'))
		) {
			throw new Meteor.Error('message-length-exceeds-character-limit');
		}

		return Livechat.sendMessage({
			guest,
			message: {
				_id,
				rid,
				msg,
				token,
				file,
				attachments,
			},
			agent,
			roomInfo: {
				source: {
					type: OmnichannelSourceType.API,
				},
			},
		});
	},
});
