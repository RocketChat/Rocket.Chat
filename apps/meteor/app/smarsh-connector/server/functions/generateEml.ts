import { Messages, SmarshHistory, Users, Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import moment from 'moment-timezone';

import { sendEmail } from './sendEmail';
import { i18n } from '../../../../server/lib/i18n';
import { settings } from '../../../settings/server';
import { MessageTypes } from '../../../ui-utils/server';

const start =
	'<table style="width: 100%; border: 1px solid; border-collapse: collapse; table-layout: fixed; margin-top: 10px; font-size: 12px; word-break: break-word;"><tbody>';
const end = '</tbody></table>';
const opentr = '<tr style="border: 1px solid;">';
const closetr = '</tr>';
const open20td = '<td style="border: 1px solid; text-align: center; width: 20%;">';
const open60td = '<td style="border: 1px solid; text-align: left; width: 60%; padding: 0 5px;">';
const closetd = '</td>';

function _getLink(attachment: { title_link: string }): string {
	const url = attachment.title_link.replace(/ /g, '%20');

	if (url.match(/^(https?:)?\/\//i)) {
		return url;
	}
	return Meteor.absoluteUrl().replace(/\/$/, '') + __meteor_runtime_config__.ROOT_URL_PATH_PREFIX + url;
}

export const generateEml = async (): Promise<void> => {
	setImmediate(async () => {
		const smarshMissingEmail = settings.get('Smarsh_MissingEmail_Email');
		const timeZone = settings.get<string>('Smarsh_Timezone');

		// TODO: revisit with more time => This appears to be a super expensive operation, going through all rooms
		for await (const room of Rooms.find()) {
			const smarshHistory = await SmarshHistory.findOne({ _id: room._id });
			const query: Record<string, any> = { rid: room._id };

			if (smarshHistory) {
				query.ts = { $gt: smarshHistory.lastRan };
			}

			const date = new Date();
			const rows: string[] = [];
			const data: {
				users: string[];
				msgs: number;
				files: string[];
				time: number;
				room: string;
			} = {
				users: [],
				msgs: 0,
				files: [],
				time: smarshHistory ? moment(date).diff(moment(smarshHistory.lastRan), 'minutes') : moment(date).diff(moment(room.ts), 'minutes'),
				room: room.name ? `#${room.name}` : `Direct Message Between: ${room?.usernames?.join(' & ')}`,
			};

			const cursor = Messages.find(query);

			for await (const message of cursor) {
				rows.push(opentr);

				// The timestamp
				rows.push(open20td);
				rows.push(moment(message.ts).tz(timeZone).format('YYYY-MM-DD HH-mm-ss z'));
				rows.push(closetd);

				// The sender
				rows.push(open20td);
				const sender = await Users.findOne({ _id: message.u._id });
				if (!sender) {
					return;
				}
				if (data.users.indexOf(sender?._id) === -1) {
					data.users.push(sender._id);
				}

				// Get the user's email, can be nothing if it is an unconfigured bot account (like rocket.cat)
				if (sender.emails?.[0]?.address) {
					rows.push(`${sender.name} &lt;${sender.emails[0].address}&gt;`);
				} else {
					rows.push(`${sender.name} &lt;${smarshMissingEmail}&gt;`);
				}
				rows.push(closetd);

				// The message
				rows.push(open60td);
				data.msgs++;
				if (message.t) {
					const messageType = MessageTypes.getType(message);
					if (messageType) {
						rows.push(
							i18n.t(messageType.message, {
								lng: 'en',
								replace: messageType.data ? messageType.data(message) : {},
							}),
						);
					} else {
						rows.push(`${message.msg} (${message.t})`);
					}
				} else if (message.file) {
					data.files.push(message.file._id);
					rows.push(`${message?.attachments?.[0].title} (${_getLink({ title_link: message?.attachments?.[0].title_link || '' })})})`);
				} else if (message.attachments) {
					const attaches: string[] = [];
					message.attachments.forEach((a) => {
						if ('image_url' in a && a.image_url !== undefined) {
							attaches.push(a.image_url);
						}
						// TODO: Verify other type of attachments which need to be handled that aren't file uploads and image urls
						// } else {
						// 	console.log(a);
						// }
					});

					rows.push(`${message.msg} (${attaches.join(', ')})`);
				} else {
					rows.push(message.msg);
				}
				rows.push(closetd);

				rows.push(closetr);
			}

			if (rows.length !== 0) {
				const result = start + rows.join('') + end;

				await SmarshHistory.updateOne(
					{ _id: room._id },
					{
						_id: room._id,
						lastRan: date,
						lastResult: result,
					},
					{ upsert: true },
				);

				await sendEmail({
					body: result,
					subject: `Rocket.Chat, ${data.users.length} Users, ${data.msgs} Messages, ${data.files.length} Files, ${data.time} Minutes, in ${data.room}`,
					files: data.files,
				});
			}
		}
	});
};
