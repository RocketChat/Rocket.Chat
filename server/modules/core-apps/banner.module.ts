import { IUiKitCoreApp } from '../../sdk/types/IUiKitCoreApp';
import { Banner, UiKitCoreApp } from '../../sdk';

export class BannerModule implements IUiKitCoreApp {
	appId = 'banner-core';

	// banner block action should just redirect the action to the correct Core App
	// the Core App identifier will be on 'blockId'
	async blockAction(payload: any): Promise<any> {
		// TODO validate payload
		const {
			payload: {
				blockId,
			},
		} = payload;

		const isRegistered = await UiKitCoreApp.isRegistered(blockId);
		if (!isRegistered) {
			throw new Error('not registered');
		}

		// change the appId with the one comming from the action to make it compliant (? - not sure this is needed)
		payload.appId = blockId;

		const result = await UiKitCoreApp.blockAction(payload);

		return result;
	}

	// when banner view is closed we need to dissmiss that banner for that user
	async viewClosed(payload: any): Promise<any> {
		// TODO validate payload
		const {
			payload: {
				bannerId,
			},
			user: {
				_id: userId,
			},
		} = payload;

		return Banner.dismiss(userId, bannerId);
	}
}
