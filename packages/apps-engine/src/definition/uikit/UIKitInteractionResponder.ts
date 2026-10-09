import type { IUIKitContextualBarResponse, IUIKitErrorResponse, IUIKitModalResponse, IUIKitResponse } from './IUIKitInteractionType';
import { UIKitInteractionType } from './IUIKitInteractionType';
import type { IUIKitSurface } from './IUIKitSurface';
import type { IUIKitBaseIncomingInteraction } from './UIKitIncomingInteractionTypes';
import { formatContextualBarInteraction, formatModalInteraction } from './UIKitInteractionPayloadFormatter';
import type { IUIKitErrorInteractionParam } from '../accessors/IUIController';

/** A modal as an App defines it. Leave the id out and one is generated. */
export type IUIKitModalViewParam = Omit<IUIKitSurface, 'appId' | 'id' | 'type'> & Partial<Pick<IUIKitSurface, 'id'>>;
/** A contextual bar as an App defines it. Leave the id out and one is generated. */
export type IUIKitContextualBarViewParam = Omit<IUIKitSurface, 'appId' | 'id' | 'type'> & Partial<Pick<IUIKitSurface, 'id'>>;

/**
 * Builds what an interaction handler returns.
 *
 * Reach it through `UIKitInteractionContext.getInteractionResponder`: it
 * already holds the interaction's trigger, so it can answer with a surface
 * where `IUIController` would need one passed in.
 */
export class UIKitInteractionResponder {
	constructor(private readonly baseContext: IUIKitBaseIncomingInteraction) {}

	/** Answers that the App handled the interaction and wants nothing shown. */
	public successResponse(): IUIKitResponse {
		return {
			success: true,
		};
	}

	/** Answers that the App could not handle the interaction. */
	public errorResponse(): IUIKitResponse {
		return {
			success: false,
		};
	}

	/** Answers by showing the user a modal. */
	public openModalViewResponse(viewData: IUIKitModalViewParam): IUIKitModalResponse {
		const { appId, triggerId } = this.baseContext;

		return {
			success: true,
			...formatModalInteraction(viewData, { appId, triggerId: triggerId!, type: UIKitInteractionType.MODAL_OPEN }),
		};
	}

	/** Answers by replacing the contents of the modal the user has open. */
	public updateModalViewResponse(viewData: IUIKitModalViewParam): IUIKitModalResponse {
		const { appId, triggerId } = this.baseContext;

		return {
			success: true,
			...formatModalInteraction(viewData, { appId, triggerId: triggerId!, type: UIKitInteractionType.MODAL_UPDATE }),
		};
	}

	/** Answers by showing the user a contextual bar. */
	public openContextualBarViewResponse(viewData: IUIKitContextualBarViewParam): IUIKitContextualBarResponse {
		const { appId, triggerId } = this.baseContext;

		return {
			success: true,
			...formatContextualBarInteraction(viewData, { appId, triggerId: triggerId!, type: UIKitInteractionType.CONTEXTUAL_BAR_OPEN }),
		};
	}

	/** Answers by replacing the contents of the contextual bar the user has open. */
	public updateContextualBarViewResponse(viewData: IUIKitContextualBarViewParam): IUIKitContextualBarResponse {
		const { appId, triggerId } = this.baseContext;

		return {
			success: true,
			...formatContextualBarInteraction(viewData, { appId, triggerId: triggerId!, type: UIKitInteractionType.CONTEXTUAL_BAR_UPDATE }),
		};
	}

	/** Answers by marking fields of the open surface as wrong, keeping it open. */
	public viewErrorResponse(errorInteraction: IUIKitErrorInteractionParam): IUIKitErrorResponse {
		const { appId, triggerId } = this.baseContext;

		return {
			appId,
			triggerId: triggerId!,
			success: false,
			type: UIKitInteractionType.ERRORS,
			viewId: errorInteraction.viewId,
			errors: errorInteraction.errors,
		};
	}
}
