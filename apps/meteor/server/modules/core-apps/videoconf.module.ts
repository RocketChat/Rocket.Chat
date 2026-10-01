import type { IUiKitCoreApp, UiKitCoreAppBlockActionPayload } from '@rocket.chat/core-services';
import { VideoConf } from '@rocket.chat/core-services';
import type * as UiKit from '@rocket.chat/ui-kit';

import { i18n } from '../../lib/i18n';

export class VideoConfModule implements IUiKitCoreApp {
	appId = 'videoconf-core';

	async blockAction(payload: UiKitCoreAppBlockActionPayload): Promise<UiKit.ServerInteraction | undefined> {
		const {
			triggerId,
			actionId,
			payload: { blockId: callId },
			user: { _id: userId } = {},
		} = payload;

		if (!callId) {
			throw new Error('invalid call');
		}

		if (actionId === 'join') {
			// TODO: Verify if we need to gate this behind the `videoconf-access` permission
			// If needed to gate behind it, find out if it should also support anonymous join (Accounts_AllowAnonymousRead)
			await VideoConf.join(userId, callId, {});
		}

		if (actionId === 'info') {
			const blocks = await VideoConf.getInfo(callId, userId);

			return {
				type: 'modal.open',
				triggerId,
				appId: this.appId,
				view: {
					appId: this.appId,
					id: `${callId}-info`,
					title: {
						type: 'plain_text',
						text: i18n.t('Video_Conference_Info'),
						emoji: false,
					},
					close: {
						type: 'button',
						appId: this.appId,
						blockId: callId,
						text: {
							type: 'plain_text',
							text: i18n.t('Close'),
							emoji: false,
						},
						actionId: 'cancel',
					},
					blocks,
				},
			};
		}
	}
}
