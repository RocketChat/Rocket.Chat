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
	 * Open a UIKit surface for a user in response to a server-side event, without a
	 * user-initiated triggerId. Requires the `ui.server-initiated-view` permission.
	 * The framework mints and registers a server interaction token; the client renders
	 * it through the dedicated server-initiated channel. Only modal / contextual bar
	 * surfaces are permitted. `view.id` is chosen by the app to correlate the submit.
	 */
	openServerInitiatedView(view: IUIKitSurfaceViewParam, user: IUser): Promise<void>;
	updateSurfaceView(view: IUIKitSurfaceViewParam, context: IUIKitInteractionParam, user: IUser): Promise<void>;
}
