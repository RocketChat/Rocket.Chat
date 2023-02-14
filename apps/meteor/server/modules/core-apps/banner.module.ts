import { Banner } from '@rocket.chat/core-services';
import type { IUiKitCoreApp } from '@rocket.chat/core-services';

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
