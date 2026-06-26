import type { IUIKitContextualBarResponse, IUIKitErrorResponse, IUIKitModalResponse, IUIKitResponse } from './IUIKitInteractionType';
import { UIKitInteractionType } from './IUIKitInteractionType';
import type { IUIKitSurface } from './IUIKitSurface';
import type { IUIKitBaseIncomingInteraction } from './UIKitIncomingInteractionTypes';
import { formatContextualBarInteraction, formatModalInteraction } from './UIKitInteractionPayloadFormatter';
import type { IUIKitErrorInteractionParam } from '../accessors/IUIController';

export type IUIKitModalViewParam = Omit<IUIKitSurface, 'appId' | 'id' | 'type'> & Partial<Pick<IUIKitSurface, 'id'>>;
export type IUIKitContextualBarViewParam = Omit<IUIKitSurface, 'appId' | 'id' | 'type'> & Partial<Pick<IUIKitSurface, 'id'>>;

// eslint-disable-next-line @typescript-eslint/naming-convention -- We need to keep the old class name so we can hide the new method behind an experimental interface
export interface UIKitInteractionResponder {
	successResponse(): IUIKitResponse;
	errorResponse(): IUIKitResponse;
	openModalViewResponse(viewData: IUIKitModalViewParam): IUIKitModalResponse;
	updateModalViewResponse(viewData: IUIKitModalViewParam): IUIKitModalResponse;
	openContextualBarViewResponse(viewData: IUIKitContextualBarViewParam): IUIKitContextualBarResponse;
	updateContextualBarViewResponse(viewData: IUIKitContextualBarViewParam): IUIKitContextualBarResponse;
	viewErrorResponse(errorInteraction: IUIKitErrorInteractionParam): IUIKitErrorResponse;
}

export class UIKitInteractionResponderImpl implements UIKitInteractionResponder {
	constructor(protected readonly baseContext: IUIKitBaseIncomingInteraction) {}

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
			...formatModalInteraction(viewData, { appId, triggerId, type: UIKitInteractionType.MODAL_OPEN }),
		};
	}

	public updateModalViewResponse(viewData: IUIKitModalViewParam): IUIKitModalResponse {
		const { appId, triggerId } = this.baseContext;

		return {
			success: true,
			...formatModalInteraction(viewData, { appId, triggerId, type: UIKitInteractionType.MODAL_UPDATE }),
		};
	}

	public openContextualBarViewResponse(viewData: IUIKitContextualBarViewParam): IUIKitContextualBarResponse {
		const { appId, triggerId } = this.baseContext;

		return {
			success: true,
			...formatContextualBarInteraction(viewData, { appId, triggerId, type: UIKitInteractionType.CONTEXTUAL_BAR_OPEN }),
		};
	}

	public updateContextualBarViewResponse(viewData: IUIKitContextualBarViewParam): IUIKitContextualBarResponse {
		const { appId, triggerId } = this.baseContext;

		return {
			success: true,
			...formatContextualBarInteraction(viewData, { appId, triggerId, type: UIKitInteractionType.CONTEXTUAL_BAR_UPDATE }),
		};
	}

	public viewErrorResponse(errorInteraction: IUIKitErrorInteractionParam): IUIKitErrorResponse {
		const { appId, triggerId } = this.baseContext;

		return {
			appId,
			triggerId,
			success: false,
			type: UIKitInteractionType.ERRORS,
			viewId: errorInteraction.viewId,
			errors: errorInteraction.errors,
		};
	}

	/**
	 * =========================================
	 * EXPERIMENTAL
	 * =========================================
	 */

	// This method isn't part of the base public interface, an augmentation interface is used to expose it as experimental
	public updateActionButtonResponse(update: {
		actionId?: string;
		labelI18n?: string;
		variant?: 'default' | 'danger';
		disabled?: boolean;
	}): {
		appId: string;
		actionId: string;
		triggerId: string;
		type: 'action_button.update';
		update: {
			actionId?: string;
			labelI18n?: string;
			variant?: 'default' | 'danger';
			disabled?: boolean;
		};
	} {
		const { appId, actionId, triggerId } = this.baseContext;

		return {
			type: 'action_button.update',
			appId,
			actionId: actionId as string,
			triggerId: triggerId as string,
			update,
		};
	}
}
