import type { IUiKitCoreApp } from '../../sdk/types/IUiKitCoreApp';
import { Banner } from '../../sdk';

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
