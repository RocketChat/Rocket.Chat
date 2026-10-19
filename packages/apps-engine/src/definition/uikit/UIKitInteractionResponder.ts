import type { IUIKitContextualBarResponse, IUIKitErrorResponse, IUIKitModalResponse, IUIKitResponse } from './IUIKitInteractionType';
import { UIKitInteractionType } from './IUIKitInteractionType';
import type { IUIKitSurface } from './IUIKitSurface';
import type { IUIKitBaseIncomingInteraction } from './UIKitIncomingInteractionTypes';
import { formatContextualBarInteraction, formatModalInteraction } from './UIKitInteractionPayloadFormatter';
import type { IUIKitErrorInteractionParam } from '../accessors/IUIController';

export type IUIKitModalViewParam = Omit<IUIKitSurface, 'appId' | 'id' | 'type'> & Partial<Pick<IUIKitSurface, 'id'>>;
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
		const { appId, triggerId } = this.baseContext;

		return {
			success: true,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- interactions that open or update views always carry a triggerId
			...formatModalInteraction(viewData, { appId, triggerId: triggerId!, type: UIKitInteractionType.MODAL_OPEN }),
		};
	}

	public updateModalViewResponse(viewData: IUIKitModalViewParam): IUIKitModalResponse {
		const { appId, triggerId } = this.baseContext;

		return {
			success: true,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- interactions that open or update views always carry a triggerId
			...formatModalInteraction(viewData, { appId, triggerId: triggerId!, type: UIKitInteractionType.MODAL_UPDATE }),
		};
	}

	public openContextualBarViewResponse(viewData: IUIKitContextualBarViewParam): IUIKitContextualBarResponse {
		const { appId, triggerId } = this.baseContext;

		return {
			success: true,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- interactions that open or update views always carry a triggerId
			...formatContextualBarInteraction(viewData, { appId, triggerId: triggerId!, type: UIKitInteractionType.CONTEXTUAL_BAR_OPEN }),
		};
	}

	public updateContextualBarViewResponse(viewData: IUIKitContextualBarViewParam): IUIKitContextualBarResponse {
		const { appId, triggerId } = this.baseContext;

		return {
			success: true,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- interactions that open or update views always carry a triggerId
			...formatContextualBarInteraction(viewData, { appId, triggerId: triggerId!, type: UIKitInteractionType.CONTEXTUAL_BAR_UPDATE }),
		};
	}

	public viewErrorResponse(errorInteraction: IUIKitErrorInteractionParam): IUIKitErrorResponse {
		const { appId, triggerId } = this.baseContext;

		return {
			appId,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- interactions that open or update views always carry a triggerId
			triggerId: triggerId!,
			success: false,
			type: UIKitInteractionType.ERRORS,
			viewId: errorInteraction.viewId,
			errors: errorInteraction.errors,
		};
	}
}
