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
						text: 'We_appreciate_your_feedback',
						emoji: false,
					},
					submit: {
						type: 'button',
						text: {
							type: 'plain_text',
							text: 'Send',
							emoji: false,
						},
						actionId: 'send-vote',
					},
					close: {
						type: 'button',
						text: {
							type: 'plain_text',
							text: 'Cancel',
							emoji: false,
						},
						actionId: 'cancel',
					},
					blocks: [
						{
							blockId: 'id',
							type: 'actions',
							elements: [
								{
									type: 'plain_text',
									text: 'Send',
									emoji: false,
								},
							],
							label: {
								type: 'plain_text',
								text: 'Score',
								emoji: false,
							},
						},
					],
				},
			};
		}
	}
}
