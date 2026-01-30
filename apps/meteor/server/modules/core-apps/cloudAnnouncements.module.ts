import { Banner } from '@rocket.chat/core-services';
import type { IUiKitCoreApp, UiKitCoreAppPayload } from '@rocket.chat/core-services';
import type { Cloud, IUser } from '@rocket.chat/core-typings';
import { Banners } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { isTruthy } from '@rocket.chat/tools';
import type * as UiKit from '@rocket.chat/ui-kit';

import { getWorkspaceAccessToken } from '../../../app/cloud/server';
import { syncWorkspace } from '../../../app/cloud/server/functions/syncWorkspace';
import { settings } from '../../../app/settings/server';
import { CloudWorkspaceConnectionError } from '../../../lib/errors/CloudWorkspaceConnectionError';
import { InvalidCloudAnnouncementInteractionError } from '../../../lib/errors/InvalidCloudAnnouncementInteractionError';
import { InvalidCoreAppInteractionError } from '../../../lib/errors/InvalidCoreAppInteractionError';
import { SystemLogger } from '../../lib/logger/system';

type CloudAnnouncementInteractant =
	| {
			user: Pick<IUser, '_id' | 'username' | 'name'>;
	  }
	| {
			visitor: Pick<Required<UiKitCoreAppPayload>['visitor'], 'id' | 'username' | 'name' | 'department' | 'phone'>;
	  };

type CloudAnnouncementInteractionRequest = UiKit.UserInteraction & CloudAnnouncementInteractant;

export class CloudAnnouncementsModule implements IUiKitCoreApp {
	appId = 'cloud-announcements-core';

	protected async getWorkspaceAccessToken() {
		return getWorkspaceAccessToken(true);
	}

	protected getCloudUrl() {
		return settings.get('Cloud_Url');
	}

	blockAction(payload: UiKitCoreAppPayload): Promise<UiKit.ServerInteraction | void> {
		return this.handlePayload(payload);
	}

	viewSubmit(payload: UiKitCoreAppPayload): Promise<UiKit.ServerInteraction | void> {
		return this.handlePayload(payload);
	}

	async viewClosed(payload: UiKitCoreAppPayload): Promise<UiKit.ServerInteraction> {
		const {
			payload: { view: { viewId, id } = {} },
			user: { _id: userId } = {},
		} = payload;

		if (!userId) {
			throw new Error('invalid user');
		}

		if (!id && !viewId) {
			throw new Error('invalid view');
		}

		if (!payload.triggerId) {
			throw new Error('invalid triggerId');
		}

		// For backwards compatibility: we prefer to use viewId, but some legacy banners
		// may only have id. We fetch all matching banners and prioritize viewId match.
		const bannerIds = [viewId, id].filter((bannerId) => isTruthy(bannerId));
		const banners = await Banners.findByIds(bannerIds).toArray();
		const announcement = banners.find((b) => b._id === viewId) || banners.find((b) => b._id === id);
		if (!announcement) {
			throw new Error('Banner not found');
		}

		await Banner.dismiss(userId, announcement._id);

		const type = announcement.surface === 'banner' ? 'banner.close' : 'modal.close';

		// for viewClosed we just need to let Cloud know that the banner was closed, no need to wait for the response

		void this.handlePayload(payload);

		return {
			type,
			triggerId: payload.triggerId,
			appId: payload.appId,
			viewId: announcement._id,
		};
	}

	protected async handlePayload(payload: UiKitCoreAppPayload): Promise<UiKit.ServerInteraction | void> {
		const interactant = this.getInteractant(payload);
		const interaction = this.getInteraction(payload);

		try {
			const serverInteraction = await this.pushUserInteraction(interactant, interaction);

			if (serverInteraction.appId !== this.appId) {
				throw new InvalidCloudAnnouncementInteractionError(`Invalid appId`);
			}

			if (serverInteraction.triggerId !== interaction.triggerId) {
				throw new InvalidCloudAnnouncementInteractionError(`Invalid triggerId`);
			}

			return serverInteraction;
		} catch (err) {
			SystemLogger.error({ err });
		}
	}

	protected getInteractant(payload: UiKitCoreAppPayload): CloudAnnouncementInteractant {
		if (payload.user) {
			return {
				user: {
					_id: payload.user._id,
					username: payload.user.username,
					name: payload.user.name,
				},
			};
		}

		if (payload.visitor) {
			return {
				visitor: {
					id: payload.visitor.id,
					username: payload.visitor.username,
					name: payload.visitor.name,
					department: payload.visitor.department,
					phone: payload.visitor.phone,
				},
			};
		}

		throw new CloudWorkspaceConnectionError(`Invalid user data received from Rocket.Chat Cloud`);
	}

	/**
	 * Transform the payload received from the Core App back to the format the UI sends from the client
	 */
	protected getInteraction(payload: UiKitCoreAppPayload): UiKit.UserInteraction {
		if (payload.type === 'blockAction' && payload.container?.type === 'message') {
			const {
				actionId,
				payload: { blockId, value },
				message,
				room,
				triggerId,
			} = payload;

			if (!actionId || !blockId || !triggerId) {
				throw new InvalidCoreAppInteractionError();
			}

			return {
				type: 'blockAction',
				actionId,
				payload: {
					blockId,
					value,
				},
				container: {
					type: 'message',
					id: String(message),
				},
				mid: String(message),
				tmid: undefined,
				rid: String(room),
				triggerId,
			};
		}

		if (payload.type === 'blockAction' && payload.container?.type === 'view') {
			const {
				actionId,
				payload: { blockId, value },
				container: { id },
				triggerId,
			} = payload;

			if (!actionId || !blockId || !triggerId) {
				throw new InvalidCoreAppInteractionError();
			}

			return {
				type: 'blockAction',
				actionId,
				payload: {
					blockId,
					value,
				},
				container: {
					type: 'view',
					id,
				},
				triggerId,
			};
		}

		if (payload.type === 'viewClosed') {
			const {
				payload: { view, isCleared },
				triggerId,
			} = payload;

			if (!view?.id || !triggerId) {
				throw new InvalidCoreAppInteractionError();
			}

			return {
				type: 'viewClosed',
				payload: {
					viewId: view.id,
					view: view as any,
					isCleared: Boolean(isCleared),
				},
				triggerId,
			};
		}

		if (payload.type === 'viewSubmit') {
			const {
				payload: { view },
				triggerId,
			} = payload;

			if (!view?.id || !triggerId) {
				throw new InvalidCoreAppInteractionError();
			}

			return {
				type: 'viewSubmit',
				payload: {
					view: view as any,
				},
				triggerId,
				viewId: view.id,
			};
		}

		throw new InvalidCoreAppInteractionError();
	}

	protected async pushUserInteraction(
		interactant: CloudAnnouncementInteractant,
		userInteraction: UiKit.UserInteraction,
	): Promise<UiKit.ServerInteraction> {
		const token = await this.getWorkspaceAccessToken();

		const request: CloudAnnouncementInteractionRequest = {
			...interactant,
			...userInteraction,
		};

		const response = await fetch(`${this.getCloudUrl()}/api/v3/comms/workspace/interaction`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(request),
		});

		if (!response.ok) {
			const { error } = await response.json();
			throw new CloudWorkspaceConnectionError(`Failed to connect to Rocket.Chat Cloud: ${error}`);
		}

		const payload: Cloud.WorkspaceInteractionResponsePayload = await response.json();

		const { serverInteraction, serverAction } = payload;

		if (serverAction) {
			switch (serverAction) {
				case 'syncWorkspace': {
					await syncWorkspace();
					break;
				}
			}
		}

		return serverInteraction;
	}
}
