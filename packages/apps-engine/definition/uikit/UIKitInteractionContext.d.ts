import type { IUIKitActionButtonIncomingInteraction, IUIKitActionButtonMessageBoxIncomingInteraction, IUIKitBaseIncomingInteraction, IUIKitBlockIncomingInteraction, IUIKitViewCloseIncomingInteraction, IUIKitViewSubmitIncomingInteraction } from './UIKitIncomingInteractionTypes';
import { UIKitInteractionResponder } from './UIKitInteractionResponder';
export declare abstract class UIKitInteractionContext {
    private baseContext;
    private responder;
    constructor(baseContext: IUIKitBaseIncomingInteraction);
    getInteractionResponder(): UIKitInteractionResponder;
    abstract getInteractionData(): IUIKitBaseIncomingInteraction;
}
export declare class UIKitBlockInteractionContext extends UIKitInteractionContext {
    private readonly interactionData;
    constructor(interactionData: IUIKitBlockIncomingInteraction);
    getInteractionData(): IUIKitBlockIncomingInteraction;
}
export declare class UIKitViewSubmitInteractionContext extends UIKitInteractionContext {
    private readonly interactionData;
    constructor(interactionData: IUIKitViewSubmitIncomingInteraction);
    getInteractionData(): IUIKitViewSubmitIncomingInteraction;
}
export declare class UIKitViewCloseInteractionContext extends UIKitInteractionContext {
    private readonly interactionData;
    constructor(interactionData: IUIKitViewCloseIncomingInteraction);
    getInteractionData(): IUIKitViewCloseIncomingInteraction;
}
export declare class UIKitActionButtonInteractionContext extends UIKitInteractionContext {
    private readonly interactionData;
    constructor(interactionData: IUIKitActionButtonIncomingInteraction | IUIKitActionButtonMessageBoxIncomingInteraction);
    getInteractionData(): IUIKitActionButtonIncomingInteraction;
}
