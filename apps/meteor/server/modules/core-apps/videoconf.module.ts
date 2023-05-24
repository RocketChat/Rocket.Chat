import type { IUiKitCoreApp } from '@rocket.chat/core-services';
import { VideoConf } from '@rocket.chat/core-services';

import { i18n } from '../../lib/i18n';

export class VideoConfModule implements IUiKitCoreApp {
	appId = 'videoconf-core';

	async blockAction(payload: any): Promise<any> {
		const {
			triggerId,
			actionId,
			payload: { blockId: callId },
			user: { _id: userId },
		} = payload;

		if (actionId === 'join') {
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
					type: 'modal',
					id: `${callId}-info`,
					title: {
						type: 'plain_text',
						text: i18n.t('Video_Conference_Info'),
						emoji: false,
					},
					close: {
						type: 'button',
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
