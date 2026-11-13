import type {
	IUIKitBlockSuggestionResponse,
	IUIKitContextualBarResponse,
	IUIKitErrorResponse,
	IUIKitModalClearResponse,
	IUIKitModalCloseResponse,
	IUIKitModalResponse,
	IUIKitResponse,
} from './IUIKitInteractionType';
import { UIKitInteractionType } from './IUIKitInteractionType';
import type { IUIKitSurface } from './IUIKitSurface';
import type { IUIKitBaseIncomingInteraction } from './UIKitIncomingInteractionTypes';
import {
	formatContextualBarInteraction,
	formatModalClearInteraction,
	formatModalCloseInteraction,
	formatModalInteraction,
} from './UIKitInteractionPayloadFormatter';
import type { IUIKitErrorInteractionParam } from '../accessors/IUIController';

export type IUIKitModalViewParam = Omit<IUIKitSurface, 'appId' | 'id' | 'type'> & Partial<Pick<IUIKitSurface, 'id'>>;
export type IUIKitHomeViewParam = Omit<IUIKitSurface, 'appId' | 'id' | 'type'> & Partial<Pick<IUIKitSurface, 'id'>>;
export type IUIKitContextualBarViewParam = Omit<IUIKitSurface, 'appId' | 'id' | 'type'> & Partial<Pick<IUIKitSurface, 'id'>>;

export class UIKitInteractionResponder {
	constructor(private readonly baseContext: IUIKitBaseIncomingInteraction) {}

	public successResponse(): IUIKitResponse {
		return {
			success: true,
		};
	}

	public errorResponse(): IUIKitResponse {
		return {
			success: false,
		};
	}

	public openModalViewResponse(viewData: IUIKitModalViewParam): IUIKitModalResponse {
		const { appId, triggerId = '' } = this.baseContext;

		return {
			success: true,
			...formatModalInteraction(viewData, { appId, triggerId, type: UIKitInteractionType.MODAL_OPEN }),
		};
	}

	public updateModalViewResponse(viewData: IUIKitModalViewParam): IUIKitModalResponse {
		const { appId, triggerId = '' } = this.baseContext;

		return {
			success: true,
			...formatModalInteraction(viewData, { appId, triggerId, type: UIKitInteractionType.MODAL_UPDATE }),
		};
	}

	/** Opens a modal on top of the one the user has open; an app keeps at most 3 stacked, beyond that the top one is replaced. */
	public pushModalViewResponse(viewData: IUIKitModalViewParam): IUIKitModalResponse {
		const { appId, triggerId } = this.baseContext;

		return {
			success: true,
			...formatModalInteraction(viewData, { appId, triggerId: triggerId!, type: UIKitInteractionType.MODAL_PUSH }),
		};
	}

	/** Closes every modal the app has open. */
	public clearModalViewsResponse(): IUIKitModalClearResponse {
		const { appId, triggerId } = this.baseContext;

		return { success: true, ...formatModalClearInteraction({ appId, triggerId: triggerId!, type: UIKitInteractionType.MODAL_CLEAR }) };
	}

	/** Closes the modal with the given id, or the one the interaction came from when no id is given. */
	public closeModalViewResponse(viewId?: string): IUIKitModalCloseResponse {
		const { appId, triggerId } = this.baseContext;

		return {
			success: true,
			...formatModalCloseInteraction(viewId, { appId, triggerId: triggerId!, type: UIKitInteractionType.MODAL_CLOSE }),
		};
	}

	public openContextualBarViewResponse(viewData: IUIKitContextualBarViewParam): IUIKitContextualBarResponse {
		const { appId, triggerId = '' } = this.baseContext;

		return {
			success: true,
			...formatContextualBarInteraction(viewData, { appId, triggerId, type: UIKitInteractionType.CONTEXTUAL_BAR_OPEN }),
		};
	}

	public updateContextualBarViewResponse(viewData: IUIKitContextualBarViewParam): IUIKitContextualBarResponse {
		const { appId, triggerId = '' } = this.baseContext;

		return {
			success: true,
			...formatContextualBarInteraction(viewData, { appId, triggerId, type: UIKitInteractionType.CONTEXTUAL_BAR_UPDATE }),
		};
	}

	public optionsResponse({ options, option_groups }: IUIKitBlockSuggestionResponse): IUIKitBlockSuggestionResponse {
		return {
			...(options && { options }),
			...(option_groups && { option_groups }),
		};
	}

	public viewErrorResponse(errorInteraction: IUIKitErrorInteractionParam): IUIKitErrorResponse {
		const { appId, triggerId = '' } = this.baseContext;

		return {
			appId,
			triggerId,
			success: false,
			type: UIKitInteractionType.ERRORS,
			viewId: errorInteraction.viewId,
			errors: errorInteraction.errors,
		};
	}
}
