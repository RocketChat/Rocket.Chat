import type { IUIController } from '../../definition/accessors';
import type { IUIKitErrorInteractionParam, IUIKitInteractionParam, IUIKitSurfaceViewParam } from '../../definition/accessors/IUIController';
import type { IUIKitContextualBarViewParam, IUIKitModalViewParam } from '../../definition/uikit/UIKitInteractionResponder';
import type { IUser } from '../../definition/users';
import type { AppBridges } from '../bridges';
export declare class UIController implements IUIController {
    private readonly appId;
    private readonly uiInteractionBridge;
    constructor(appId: string, bridges: AppBridges);
    /**
     * @deprecated please prefer the `openSurfaceView` method
     */
    openModalView(view: IUIKitModalViewParam, context: IUIKitInteractionParam, user: IUser): Promise<void>;
    /**
     * @deprecated please prefer the `updateSurfaceView` method
     */
    updateModalView(view: IUIKitModalViewParam, context: IUIKitInteractionParam, user: IUser): Promise<void>;
    /**
     * @deprecated please prefer the `openSurfaceView` method
     */
    openContextualBarView(view: IUIKitContextualBarViewParam, context: IUIKitInteractionParam, user: IUser): Promise<void>;
    /**
     * @deprecated please prefer the `updateSurfaceView` method
     */
    updateContextualBarView(view: IUIKitContextualBarViewParam, context: IUIKitInteractionParam, user: IUser): Promise<void>;
    openSurfaceView(view: IUIKitSurfaceViewParam, context: IUIKitInteractionParam, user: IUser): Promise<void>;
    updateSurfaceView(view: IUIKitSurfaceViewParam, context: IUIKitInteractionParam, user: IUser): Promise<void>;
    setViewError(errorInteraction: IUIKitErrorInteractionParam, context: IUIKitInteractionParam, user: IUser): Promise<void>;
    private openContextualBar;
    private openModal;
}
