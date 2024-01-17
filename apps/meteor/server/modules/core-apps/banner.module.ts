import { Banner } from '@rocket.chat/core-services';
import type { IUiKitCoreApp, UiKitCoreAppPayload } from '@rocket.chat/core-services';
import type * as UiKit from '@rocket.chat/ui-kit';

export class BannerModule implements IUiKitCoreApp {
	appId = 'banner-core';

	// when banner view is closed we need to dismiss that banner for that user
	async viewClosed(payload: UiKitCoreAppPayload): Promise<UiKit.ServerInteraction> {
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

		if (!payload.triggerId) {
			throw new Error('invalid triggerId');
		}

		await Banner.dismiss(userId, bannerId);

		return {
			type: 'banner.close',
			triggerId: payload.triggerId,
			appId: payload.appId,
			viewId: bannerId,
		};
	}
}
