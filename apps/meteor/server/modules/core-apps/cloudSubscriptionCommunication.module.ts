import type { UiKitCoreAppPayload } from '@rocket.chat/core-services';
import type * as UiKit from '@rocket.chat/ui-kit';

import { CloudAnnouncementsModule } from './cloudAnnouncements.module';

export class CloudSubscriptionCommunication extends CloudAnnouncementsModule {
	appId = 'cloud-communication-core';

	async viewClosed(payload: UiKitCoreAppPayload): Promise<UiKit.ServerInteraction> {
		const {
			payload: { view: { viewId } = {} },
			user: { _id: userId } = {},
		} = payload;

		if (!userId) {
			throw new Error('invalid user');
		}

		if (!viewId) {
			throw new Error('invalid view');
		}

		if (!payload.triggerId) {
			throw new Error('invalid triggerId');
		}

		// for viewClosed we just need to let Cloud know that the banner was closed, no need to wait for the response

		void this.handlePayload(payload);

		return {
			type: 'modal.close',
			triggerId: payload.triggerId,
			appId: payload.appId,
		};
	}
}
