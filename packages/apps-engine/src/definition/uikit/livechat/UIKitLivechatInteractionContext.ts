import type { IUIKitBaseIncomingInteraction } from '../UIKitIncomingInteractionTypes';
import { UIKitInteractionResponder } from '../UIKitInteractionResponder';
import type { IUIKitLivechatBaseIncomingInteraction, IUIKitLivechatBlockIncomingInteraction } from './UIKitLivechatIncomingInteractionType';

/**
 * What a Livechat visitor did with an App's blocks, and the means to answer.
 *
 * The Livechat counterpart of `UIKitInteractionContext`.
 */
export abstract class UIKitLivechatInteractionContext {
	private baseContext: IUIKitLivechatBaseIncomingInteraction;

	private responder: UIKitInteractionResponder;

	constructor(baseContext: IUIKitLivechatBaseIncomingInteraction) {
		const { appId, actionId, room, visitor, triggerId } = baseContext;

		this.baseContext = { appId, actionId, room, visitor, triggerId };

		this.responder = new UIKitInteractionResponder(this.baseContext as any as IUIKitBaseIncomingInteraction);
	}

	/** Gets the responder that builds this handler's return value. */
	public getInteractionResponder() {
		return this.responder;
	}

	/** Gets what the visitor did, typed to the kind of interaction this is. */
	public abstract getInteractionData(): IUIKitLivechatBaseIncomingInteraction;
}

/** A visitor used a block element: pressed a button, picked an option, typed into an input. */
export class UIKitLivechatBlockInteractionContext extends UIKitLivechatInteractionContext {
	constructor(private readonly interactionData: IUIKitLivechatBlockIncomingInteraction) {
		super(interactionData);
	}

	public getInteractionData(): IUIKitLivechatBlockIncomingInteraction {
		return this.interactionData;
	}
}
