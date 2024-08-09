import type { ILivechatVisitor, IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { LivechatVisitors, Messages, LivechatRooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { Livechat as LivechatTyped } from '../lib/LivechatTyped';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:registerGuest'({
			token,
			name,
			email,
			department,
			customFields,
		}?: {
			token?: string;
			name?: string;
			email?: string;
			department?: string;
			customFields?: Array<{ key: string; value: string; overwrite: boolean; scope?: unknown }>;
		}): {
			userId: ILivechatVisitor['_id'];
			visitor: Pick<ILivechatVisitor, '_id' | 'token' | 'name' | 'username' | 'visitorEmails' | 'department'>;
		};
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:registerGuest'({ token, name, email, department, customFields } = {}): Promise<{
		userId: ILivechatVisitor['_id'];
		visitor: Pick<ILivechatVisitor, '_id' | 'token' | 'name' | 'username' | 'visitorEmails' | 'department'>;
	}> {
		methodDeprecationLogger.method('livechat:registerGuest', '7.0.0');

		if (!token) {
			throw new Meteor.Error('error-invalid-token', 'Invalid token', { method: 'livechat:registerGuest' });
		}

		const visitor = await LivechatTyped.registerGuest.call(this, {
			token,
			name,
			email,
			department,
		});

		// update visited page history to not expire
		await Messages.keepHistoryForToken(token);

		if (!visitor) {
			throw new Meteor.Error('error-invalid-visitor', 'Invalid visitor', { method: 'livechat:registerGuest' });
		}

		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
		// If it's updating an existing visitor, it must also update the roomInfo
		const rooms: IRoom[] = await LivechatRooms.findOpenByVisitorToken(token, {}, extraQuery).toArray();
		await Promise.all(
			rooms.map((room) =>
				LivechatTyped.saveRoomInfo(room, {
					_id: visitor._id,
					name: visitor.name,
					phone: visitor.phone?.[0]?.phoneNumber,
					livechatData: visitor.livechatData as { [k: string]: string },
				}),
			),
		);

		if (customFields && customFields instanceof Array) {
			for await (const customField of customFields) {
				if (typeof customField !== 'object') {
					continue;
				}

				if (!customField.scope || customField.scope !== 'room') {
					const { key, value, overwrite } = customField;
					await LivechatVisitors.updateLivechatDataByToken(token, key, value, overwrite);
				}
			}
		}

		return {
			userId: visitor._id,
			visitor: {
				_id: visitor._id,
				token: visitor.token,
				name: visitor.name,
				username: visitor.username,
				visitorEmails: visitor.visitorEmails,
				department: visitor.department,
			},
		};
	},
});
