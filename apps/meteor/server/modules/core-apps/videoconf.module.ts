import type { IUiKitCoreApp } from '../../sdk/types/IUiKitCoreApp';
import { VideoConf } from '../../sdk';

export class VideoConfModule implements IUiKitCoreApp {
	appId = 'videoconf-core';

	async blockAction(payload: any): Promise<any> {
		const {
			actionId,
			payload: { blockId: callId },
			user: { _id: userId },
		} = payload;

		if (actionId === 'join') {
			VideoConf.join(userId, callId, {});
		}
	}
}
