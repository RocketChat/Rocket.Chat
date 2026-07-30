import type { IUIController } from '@rocket.chat/apps-engine/definition/accessors';
import type {
	IUIKitErrorInteractionParam,
	IUIKitInteractionParam,
	IUIKitSurfaceViewParam,
} from '@rocket.chat/apps-engine/definition/accessors/IUIController';
import { UIKitInteractionType, UIKitSurfaceType } from '@rocket.chat/apps-engine/definition/uikit';
import {
	formatContextualBarInteraction,
	formatErrorInteraction,
	formatModalInteraction,
} from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionPayloadFormatter';
import type {
	IUIKitContextualBarViewParam,
	IUIKitModalViewParam,
} from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import { AppObjectRegistry } from '../../../AppObjectRegistry';
import { UIHelper } from '../../UIHelper';
import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class UIController implements IUIController {
	constructor(private readonly bridges: RemoteBridges) {}

	// The real app id, used to stamp block/interaction payloads (a non-identity, local use). The
	// trailing appId passed to `doNotifyUser` uses the 'APP_ID' sentinel instead so the host
	// substitutes the verified id for its permission check.
	private get appId(): string {
		return AppObjectRegistry.get<string>('id') || '';
	}

	/**
	 * @deprecated please prefer the `openSurfaceView` method
	 */
	public openModalView(view: IUIKitModalViewParam, context: IUIKitInteractionParam, user: IUser) {
		return this.openModal(view, context, user);
	}

	/**
	 * @deprecated please prefer the `updateSurfaceView` method
	 */
	public updateModalView(view: IUIKitModalViewParam, context: IUIKitInteractionParam, user: IUser) {
		return this.openModal(view, context, user, true);
	}

	/**
	 * @deprecated please prefer the `openSurfaceView` method
	 */
	public openContextualBarView(view: IUIKitContextualBarViewParam, context: IUIKitInteractionParam, user: IUser) {
		return this.openContextualBar(view, context, user);
	}

	/**
	 * @deprecated please prefer the `updateSurfaceView` method
	 */
	public updateContextualBarView(view: IUIKitContextualBarViewParam, context: IUIKitInteractionParam, user: IUser) {
		return this.openContextualBar(view, context, user, true);
	}

	public openSurfaceView(view: IUIKitSurfaceViewParam, context: IUIKitInteractionParam, user: IUser) {
		const blocks = UIHelper.assignIds(view.blocks, this.appId);
		const viewWithIds = { ...view, blocks };

		switch (view.type) {
			case UIKitSurfaceType.CONTEXTUAL_BAR:
				return this.openContextualBar(viewWithIds, context, user);
			case UIKitSurfaceType.MODAL:
				return this.openModal(viewWithIds, context, user);
		}
	}

	public updateSurfaceView(view: IUIKitSurfaceViewParam, context: IUIKitInteractionParam, user: IUser) {
		const blocks = UIHelper.assignIds(view.blocks, this.appId);
		const viewWithIds = { ...view, blocks };

		switch (view.type) {
			case UIKitSurfaceType.CONTEXTUAL_BAR:
				return this.openContextualBar(viewWithIds, context, user, true);
			case UIKitSurfaceType.MODAL:
				return this.openModal(viewWithIds, context, user, true);
		}
	}

	public setViewError(errorInteraction: IUIKitErrorInteractionParam, context: IUIKitInteractionParam, user: IUser) {
		const interactionContext = {
			...context,
			type: UIKitInteractionType.ERRORS,
			appId: this.appId,
		};

		return this.bridges
			.getUiInteractionBridge()
			.doNotifyUser(user, formatErrorInteraction(errorInteraction, interactionContext), 'APP_ID') as Promise<void>;
	}

	private openContextualBar(
		view: IUIKitContextualBarViewParam,
		context: IUIKitInteractionParam,
		user: IUser,
		isUpdate = false,
	): Promise<void> {
		let type = UIKitInteractionType.CONTEXTUAL_BAR_OPEN;
		if (isUpdate) {
			type = UIKitInteractionType.CONTEXTUAL_BAR_UPDATE;
		}
		const interactionContext = {
			...context,
			type,
			appId: this.appId,
		};

		return this.bridges
			.getUiInteractionBridge()
			.doNotifyUser(user, formatContextualBarInteraction(view, interactionContext), 'APP_ID') as Promise<void>;
	}

	private openModal(view: IUIKitModalViewParam, context: IUIKitInteractionParam, user: IUser, isUpdate = false): Promise<void> {
		let type = UIKitInteractionType.MODAL_OPEN;
		if (isUpdate) {
			type = UIKitInteractionType.MODAL_UPDATE;
		}
		const interactionContext = {
			...context,
			type,
			appId: this.appId,
		};

		return this.bridges
			.getUiInteractionBridge()
			.doNotifyUser(user, formatModalInteraction(view, interactionContext), 'APP_ID') as Promise<void>;
	}
}
