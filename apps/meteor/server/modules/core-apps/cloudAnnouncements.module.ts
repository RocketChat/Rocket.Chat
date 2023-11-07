import type { IUiKitCoreApp, UiKitCoreAppPayload } from '@rocket.chat/core-services';
import { CloudAnnouncements } from '@rocket.chat/models';

export class CloudAnnouncementsModule implements IUiKitCoreApp {
	appId = 'cloud-announcements-core';

	// TODO: forward to Cloud Workspace API and update announcements
	blockAction(_payload: UiKitCoreAppPayload): Promise<unknown> {
		return Promise.resolve();
	}

	// TODO: forward to Cloud Workspace API and update announcements
	viewSubmit(_payload: UiKitCoreAppPayload): Promise<unknown> {
		return Promise.resolve();
	}

	// TODO: forward to Cloud Workspace API and update announcements
	async viewClosed(payload: UiKitCoreAppPayload): Promise<unknown> {
		const { view } = payload.payload;

		if (!view) {
			// TODO: should we throw an error here?
			return;
		}

		const viewId = view.id || view.viewId;

		if (!viewId) {
			// TODO: should we throw an error here?
			return;
		}

		await CloudAnnouncements.removeByViewId(viewId);
		return undefined;
	}
}
