import type { IUIKitBaseIncomingInteraction } from '../UIKitIncomingInteractionTypes';
import { UIKitInteractionResponder } from '../UIKitInteractionResponder';
import type {
	IUIKitLivechatBaseIncomingInteraction,
	IUIKitLivechatBlockIncomingInteraction,
	IUIKitLivechatViewCloseIncomingInteraction,
	IUIKitLivechatViewSubmitIncomingInteraction,
} from './UIKitLivechatIncomingInteractionType';

export abstract class UIKitLivechatInteractionContext {
	private baseContext: IUIKitLivechatBaseIncomingInteraction;

	private responder: UIKitInteractionResponder;

	constructor(baseContext: IUIKitLivechatBaseIncomingInteraction) {
		const { appId, actionId, room, visitor, triggerId } = baseContext;

		this.baseContext = { appId, actionId, room, visitor, triggerId };

		this.responder = new UIKitInteractionResponder(this.baseContext as any as IUIKitBaseIncomingInteraction);
	}

	public getInteractionResponder() {
		return this.responder;
	}

	public abstract getInteractionData(): IUIKitLivechatBaseIncomingInteraction;
}

export class UIKitLivechatBlockInteractionContext extends UIKitLivechatInteractionContext {
	constructor(private readonly interactionData: IUIKitLivechatBlockIncomingInteraction) {
		super(interactionData);
	}

	public getInteractionData(): IUIKitLivechatBlockIncomingInteraction {
		return this.interactionData;
	}
}

export class UIKitLivechatViewSubmitInteractionContext extends UIKitLivechatInteractionContext {
	constructor(private readonly interactionData: IUIKitLivechatViewSubmitIncomingInteraction) {
		super(interactionData);
	}

	public getInteractionData(): IUIKitLivechatViewSubmitIncomingInteraction {
		return this.interactionData;
	}
}

export class UIKitLivechatViewCloseInteractionContext extends UIKitLivechatInteractionContext {
	constructor(private readonly interactionData: IUIKitLivechatViewCloseIncomingInteraction) {
		super(interactionData);
	}

	public getInteractionData(): IUIKitLivechatViewCloseIncomingInteraction {
		return this.interactionData;
	}
}
