import type {
	IUIKitActionButtonIncomingInteraction,
	IUIKitActionButtonMessageBoxIncomingInteraction,
	IUIKitBaseIncomingInteraction,
	IUIKitBlockIncomingInteraction,
	IUIKitViewCloseIncomingInteraction,
	IUIKitViewSubmitIncomingInteraction,
} from './UIKitIncomingInteractionTypes';
import { UIKitInteractionResponder } from './UIKitInteractionResponder';

/**
 * What a user did with an App's blocks, and the means to answer.
 *
 * Handlers receive a subclass: narrow to it, or call
 * {@link UIKitInteractionContext.getInteractionData} for the typed payload.
 */
export abstract class UIKitInteractionContext {
	private baseContext: IUIKitBaseIncomingInteraction;

	private responder: UIKitInteractionResponder;

	constructor(baseContext: IUIKitBaseIncomingInteraction) {
		const { appId, actionId, room, user, triggerId, threadId } = baseContext;

		this.baseContext = { appId, actionId, room, user, triggerId, threadId };

		this.responder = new UIKitInteractionResponder(this.baseContext);
	}

	/** Gets the responder that builds this handler's return value. */
	public getInteractionResponder() {
		return this.responder;
	}

	/** Gets what the user did, typed to the kind of interaction this is. */
	public abstract getInteractionData(): IUIKitBaseIncomingInteraction;
}

/** A user used a block element: pressed a button, picked an option, typed into an input. */
export class UIKitBlockInteractionContext extends UIKitInteractionContext {
	constructor(private readonly interactionData: IUIKitBlockIncomingInteraction) {
		super(interactionData);
	}

	public getInteractionData(): IUIKitBlockIncomingInteraction {
		return this.interactionData;
	}
}

/** A user submitted a surface. */
export class UIKitViewSubmitInteractionContext extends UIKitInteractionContext {
	constructor(private readonly interactionData: IUIKitViewSubmitIncomingInteraction) {
		super(interactionData);
	}

	public getInteractionData(): IUIKitViewSubmitIncomingInteraction {
		return this.interactionData;
	}
}

/** A user dismissed a surface that was opened with `notifyOnClose`. */
export class UIKitViewCloseInteractionContext extends UIKitInteractionContext {
	constructor(private readonly interactionData: IUIKitViewCloseIncomingInteraction) {
		super(interactionData);
	}

	public getInteractionData(): IUIKitViewCloseIncomingInteraction {
		return this.interactionData;
	}
}

/** A user pressed one of the App's action buttons. */
export class UIKitActionButtonInteractionContext extends UIKitInteractionContext {
	constructor(private readonly interactionData: IUIKitActionButtonIncomingInteraction | IUIKitActionButtonMessageBoxIncomingInteraction) {
		super(interactionData);
	}

	public getInteractionData(): IUIKitActionButtonIncomingInteraction {
		return this.interactionData;
	}
}
