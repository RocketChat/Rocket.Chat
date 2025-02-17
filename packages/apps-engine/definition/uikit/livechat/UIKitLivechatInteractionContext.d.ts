import { UIKitInteractionResponder } from '../UIKitInteractionResponder';
import type { IUIKitLivechatBaseIncomingInteraction, IUIKitLivechatBlockIncomingInteraction } from './UIKitLivechatIncomingInteractionType';
export declare abstract class UIKitLivechatInteractionContext {
    private baseContext;
    private responder;
    constructor(baseContext: IUIKitLivechatBaseIncomingInteraction);
    getInteractionResponder(): UIKitInteractionResponder;
    abstract getInteractionData(): IUIKitLivechatBaseIncomingInteraction;
}
export declare class UIKitLivechatBlockInteractionContext extends UIKitLivechatInteractionContext {
    private readonly interactionData;
    constructor(interactionData: IUIKitLivechatBlockIncomingInteraction);
    getInteractionData(): IUIKitLivechatBlockIncomingInteraction;
}
