import type { IUIController } from '../../definition/accessors';
import type { IUIKitErrorInteractionParam, IUIKitInteractionParam, IUIKitSurfaceViewParam } from '../../definition/accessors/IUIController';
import { UIKitInteractionType, UIKitSurfaceType } from '../../definition/uikit';
import { formatContextualBarInteraction, formatErrorInteraction, formatModalInteraction } from '../../definition/uikit/UIKitInteractionPayloadFormatter';
import type { IUIKitContextualBarViewParam, IUIKitModalViewParam } from '../../definition/uikit/UIKitInteractionResponder';
import type { IUser } from '../../definition/users';
import type { AppBridges, UiInteractionBridge } from '../bridges';
import { UIHelper } from '../misc/UIHelper';

export class UIController implements IUIController {
    private readonly uiInteractionBridge: UiInteractionBridge;

    constructor(private readonly appId: string, bridges: AppBridges) {
        this.uiInteractionBridge = bridges.getUiInteractionBridge();
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

        return this.uiInteractionBridge.doNotifyUser(user, formatErrorInteraction(errorInteraction, interactionContext), this.appId);
    }

    private openContextualBar(view: IUIKitContextualBarViewParam, context: IUIKitInteractionParam, user: IUser, isUpdate = false): Promise<void> {
        let type = UIKitInteractionType.CONTEXTUAL_BAR_OPEN;
        if (isUpdate) {
            type = UIKitInteractionType.CONTEXTUAL_BAR_UPDATE;
        }
        const interactionContext = {
            ...context,
            type,
            appId: this.appId,
        };

        return this.uiInteractionBridge.doNotifyUser(user, formatContextualBarInteraction(view, interactionContext), this.appId);
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

        return this.uiInteractionBridge.doNotifyUser(user, formatModalInteraction(view, interactionContext), this.appId);
    }
}
