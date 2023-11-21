import { Authorization, MeteorError, type IApiService } from '@rocket.chat/core-services';
import { type IMessage, type IUser } from '@rocket.chat/core-typings';

import { i18n } from '../../../lib/i18n';

export class BeforeSavePreventMention {
	constructor(private api?: IApiService) {}

	async preventMention({
		message,
		user,
		mention,
		permission,
	}: {
		message: IMessage;
		user: Pick<IUser, '_id' | 'username' | 'name' | 'language'>;
		mention: 'here' | 'all';
		permission: string;
	}): Promise<boolean> {
		if (!message.mentions?.some(({ _id }) => _id === mention)) {
			return true;
		}

		// Check if the user has permissions to use @all in both global and room scopes.
		if (await Authorization.hasPermission(message.u._id, permission)) {
			return true;
		}

		if (await Authorization.hasPermission(message.u._id, permission, message.rid)) {
			return true;
		}

		const action = i18n.t('Notify_all_in_this_room', { lng: user.language });

		// Add a notification to the chat, informing the user that this
		// action is not allowed.
		void this.api?.broadcast('notify.ephemeralMessage', message.u._id, message.rid, {
			// TODO: i18n
			msg: i18n.t('error-action-not-allowed', { action } as any, user.language),
		});

		// Also throw to stop propagation of 'sendMessage'.
		throw new MeteorError('error-action-not-allowed', `Notify ${mention} in this room not allowed`, {
			action: 'Notify_all_in_this_room',
		});
	}
}
