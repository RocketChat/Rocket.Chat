import type { IUIKitErrorInteraction, IUIKitInteraction, IUIKitSurface } from '../uikit';
import type { IUIKitContextualBarViewParam, IUIKitModalViewParam } from '../uikit/UIKitInteractionResponder';
import type { IUser } from '../users';

export type IUIKitInteractionParam = Omit<IUIKitInteraction, 'appId' | 'type'>;
export type IUIKitErrorInteractionParam = Omit<IUIKitErrorInteraction, 'type' | 'appId' | 'triggerId'>;

export type IUIKitSurfaceViewParam = Omit<IUIKitSurface, 'appId' | 'id'> & Partial<Pick<IUIKitSurface, 'id'>>;

export interface IUIController {
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
	setViewError(errorInteraction: IUIKitErrorInteractionParam, context: IUIKitInteractionParam, user: IUser): Promise<void>;
	openSurfaceView(view: IUIKitSurfaceViewParam, context: IUIKitInteractionParam, user: IUser): Promise<void>;
	/**
	 * Updates the view with the same `id`, or, when the view carries an `external_id`, the one the user has open with that
	 * `external_id`. An update whose `hash` differs from the one the host saved last is stale and is dropped.
	 */
	updateSurfaceView(view: IUIKitSurfaceViewParam, context: IUIKitInteractionParam, user: IUser): Promise<void>;
	/** Opens a modal on top of the user's open ones; an app keeps at most 3 stacked, beyond that the top one is replaced. */
	pushModalView(view: IUIKitModalViewParam, context: IUIKitInteractionParam, user: IUser): Promise<void>;
	/** Closes the modal with the given `viewId`. */
	closeModalView(viewId: string, context: IUIKitInteractionParam, user: IUser): Promise<void>;
	/** Closes every modal the app has open for the user. */
	clearModalViews(context: IUIKitInteractionParam, user: IUser): Promise<void>;
}
