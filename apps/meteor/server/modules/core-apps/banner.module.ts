import { Banner } from '@rocket.chat/core-sdk';
import type { IUiKitCoreApp } from '@rocket.chat/core-sdk';

export class BannerModule implements IUiKitCoreApp {
	appId = 'banner-core';

	// when banner view is closed we need to dissmiss that banner for that user
	async viewClosed(payload: any): Promise<any> {
		const {
			payload: {
				view: { viewId: bannerId },
			},
			user: { _id: userId },
		} = payload;

		return Banner.dismiss(userId, bannerId);
	}
}
