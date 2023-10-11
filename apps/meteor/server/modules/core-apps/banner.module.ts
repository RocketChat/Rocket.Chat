import { Banner } from '@rocket.chat/core-services';
import type { IUiKitCoreApp, UiKitCoreAppPayload } from '@rocket.chat/core-services';

export class BannerModule implements IUiKitCoreApp {
	appId = 'banner-core';

	// when banner view is closed we need to dissmiss that banner for that user
	async viewClosed(payload: UiKitCoreAppPayload) {
		const {
			payload: { view: { viewId: bannerId } = {} },
			user: { _id: userId } = {},
		} = payload;

		if (!userId) {
			throw new Error('invalid user');
		}

		if (!bannerId) {
			throw new Error('invalid banner');
		}

		return Banner.dismiss(userId, bannerId);
	}
}
