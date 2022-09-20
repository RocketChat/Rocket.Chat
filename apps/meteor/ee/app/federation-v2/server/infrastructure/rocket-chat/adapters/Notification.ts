import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { api } from '../../../../../../../server/sdk/api';

export class RocketChatNotificationAdapter {
	public notifyWithEphemeralMessage(i18nMessageKey: string, userId: string, roomId: string, language = 'en'): void {
		api.broadcast('notify.ephemeralMessage', userId, roomId, {
			msg: TAPi18n.__(i18nMessageKey, {
				postProcess: 'sprintf',
				lng: language,
			}),
		});
	}
}
