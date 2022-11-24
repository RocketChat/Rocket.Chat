import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import type { IUiKitCoreApp } from '../../sdk/types/IUiKitCoreApp';
import { VideoConf } from '../../sdk';

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
			VideoConf.join(userId, callId, {});
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
						text: TAPi18n.__('Video_Conference_Info'),
						emoji: false,
					},
					close: {
						type: 'button',
						text: {
							type: 'plain_text',
							text: TAPi18n.__('Close'),
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
