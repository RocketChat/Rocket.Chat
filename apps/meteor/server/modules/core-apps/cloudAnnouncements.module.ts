import type { IUiKitCoreApp, UiKitCoreAppPayload } from '@rocket.chat/core-services';
import type { Serialized, UiKit } from '@rocket.chat/core-typings';
import { CloudAnnouncements } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { getWorkspaceAccessToken } from '../../../app/cloud/server';
import { settings } from '../../../app/settings/server';
import { CloudWorkspaceConnectionError } from '../../../lib/errors/CloudWorkspaceConnectionError';
import { exhaustiveCheck } from '../../../lib/utils/exhaustiveCheck';

export class CloudAnnouncementsModule implements IUiKitCoreApp {
	appId = 'cloud-announcements-core';

	protected async getWorkspaceAccessToken() {
		return getWorkspaceAccessToken(true);
	}

	protected getCloudUrl() {
		return settings.get('Cloud_Url');
	}

	private async pushUserInteraction(userInteraction: UiKit.UserInteraction): Promise<Serialized<UiKit.ServerInteraction>> {
		const token = await this.getWorkspaceAccessToken();

		const response = await fetch(`${this.getCloudUrl()}/api/v3/comms/workspace/interaction`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(userInteraction),
		});

		if (!response.ok) {
			const { error } = await response.json();
			throw new CloudWorkspaceConnectionError(`Failed to connect to Rocket.Chat Cloud: ${error}`);
		}

		const serverInteraction: UiKit.ServerInteraction = await response.json();

		return serverInteraction;
	}

	private async handleServerInteraction(serverInteraction: UiKit.ServerInteraction): Promise<void> {
		switch (serverInteraction.type) {
			case 'modal.open': {
				const { view } = serverInteraction;
				await CloudAnnouncements.updateMany({ 'view.id': view.id }, { $set: { view } });
				break;
			}

			case 'modal.update': {
				const { view } = serverInteraction;
				await CloudAnnouncements.updateMany({ 'view.id': view.id }, { $set: { view } });
				break;
			}

			case 'modal.close': {
				const { viewId } = serverInteraction;
				await CloudAnnouncements.deleteMany({ 'view.id': viewId });
				break;
			}

			case 'banner.open': {
				const { type, triggerId, ...view } = serverInteraction;
				await CloudAnnouncements.updateMany({ 'view.viewId': view.viewId }, { $set: { view } });
				break;
			}

			case 'banner.update': {
				const { view } = serverInteraction;
				await CloudAnnouncements.updateMany({ 'view.viewId': view.viewId }, { $set: { view } });
				break;
			}

			case 'banner.close': {
				const { viewId } = serverInteraction;
				await CloudAnnouncements.deleteMany({ 'view.viewId': viewId });
				break;
			}

			case 'contextual_bar.open': {
				const { view } = serverInteraction;
				await CloudAnnouncements.updateMany({ 'view.id': view.id }, { $set: { view } });
				break;
			}

			case 'contextual_bar.update': {
				const { view } = serverInteraction;
				await CloudAnnouncements.updateMany({ 'view.id': view.id }, { $set: { view } });
				break;
			}

			case 'contextual_bar.close': {
				const { view } = serverInteraction;
				await CloudAnnouncements.updateMany({ 'view.id': view.id }, { $set: { view } });
				break;
			}

			case 'errors':
				break;

			default:
				exhaustiveCheck(serverInteraction);
		}
	}

	private async handleFallbackInteraction(userInteraction: UiKit.UserInteraction): Promise<void> {
		if (userInteraction.type === 'viewClosed') {
			await CloudAnnouncements.deleteMany({ 'view.id': userInteraction.payload.viewId ?? userInteraction.payload.view.id });
		}
	}

	private async forwardInteraction(userInteraction: UiKit.UserInteraction): Promise<UiKit.ServerInteraction> {
		try {
			const serverInteraction = await this.pushUserInteraction(userInteraction);

			if (serverInteraction.appId !== this.appId) {
				throw new CloudWorkspaceConnectionError(`Invalid appId received from Rocket.Chat Cloud`);
			}

			if (serverInteraction.triggerId !== userInteraction.triggerId) {
				throw new CloudWorkspaceConnectionError(`Invalid triggerId received from Rocket.Chat Cloud`);
			}

			await this.handleServerInteraction(serverInteraction);

			return serverInteraction;
		} catch (error) {
			await this.handleFallbackInteraction(userInteraction);

			throw error;
		}
	}

	blockAction(payload: UiKitCoreAppPayload): Promise<unknown> {
		return this.forwardInteraction(payload as unknown as UiKit.UserInteraction);
	}

	viewSubmit(payload: UiKitCoreAppPayload): Promise<unknown> {
		return this.forwardInteraction(payload as unknown as UiKit.UserInteraction);
	}

	async viewClosed(payload: UiKitCoreAppPayload): Promise<unknown> {
		return this.forwardInteraction(payload as unknown as UiKit.UserInteraction);
	}
}
