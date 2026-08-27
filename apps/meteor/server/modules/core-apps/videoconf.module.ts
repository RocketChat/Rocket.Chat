import type { IUiKitCoreApp, UiKitCoreAppBlockActionPayload } from '@rocket.chat/core-services';
import { VideoConf } from '@rocket.chat/core-services';
import type * as UiKit from '@rocket.chat/ui-kit';

import { hasAtLeastOnePermissionAsync } from '../../lib/authorization/hasPermission';
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
			const call = await VideoConf.get(callId);
			if (!call) {
				throw new Error('invalid call');
			}

			if (!userId || !(await hasAtLeastOnePermissionAsync(userId, ['call-management', 'videoconf-join-call'], call.rid))) {
				throw new Error('not-allowed');
			}

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
