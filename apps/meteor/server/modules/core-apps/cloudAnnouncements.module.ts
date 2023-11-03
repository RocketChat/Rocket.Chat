import type { IUiKitCoreApp, UiKitCoreAppPayload } from '@rocket.chat/core-services';

export class CloudAnnouncementsModule implements IUiKitCoreApp {
	appId = 'cloud-announcements-core';

	blockAction?(_payload: UiKitCoreAppPayload): Promise<unknown> {
		throw new Error('Method not implemented.');
	}

	viewClosed?(_payload: UiKitCoreAppPayload): Promise<unknown> {
		throw new Error('Method not implemented.');
	}

	viewSubmit?(_payload: UiKitCoreAppPayload): Promise<unknown> {
		throw new Error('Method not implemented.');
	}
}
