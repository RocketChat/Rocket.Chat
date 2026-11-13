import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { AppMethod } from '../metadata';
import type { IUIKitBlockSuggestionResponse, IUIKitResponse } from './IUIKitInteractionType';
import type {
	UIKitActionButtonInteractionContext,
	UIKitAppHomeOpenedInteractionContext,
	UIKitBlockInteractionContext,
	UIKitBlockSuggestionInteractionContext,
	UIKitViewCloseInteractionContext,
	UIKitViewSubmitInteractionContext,
} from './UIKitInteractionContext';

/** Handler for after a message is sent. */
export interface IUIKitInteractionHandler {
	/**
	 * Method called when a block action is invoked.
	 *
	 * @param context
	 * @param read An accessor to the environment
	 * @param http An accessor to the outside world
	 * @param persistence An accessor to the App's persistence
	 */
	[AppMethod.UIKIT_BLOCK_ACTION]?(
		context: UIKitBlockInteractionContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<IUIKitResponse>;

	/**
	 * Method called while the user types in an external select, to get the options to offer.
	 *
	 * @param context
	 * @param read An accessor to the environment
	 * @param http An accessor to the outside world
	 * @param persistence An accessor to the App's persistence
	 */
	[AppMethod.UIKIT_BLOCK_SUGGESTION]?(
		context: UIKitBlockSuggestionInteractionContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<IUIKitBlockSuggestionResponse>;

	/**
	 * Method called when a modal is submitted.
	 *
	 * @param context
	 * @param read An accessor to the environment
	 * @param http An accessor to the outside world
	 * @param persistence An accessor to the App's persistence
	 */
	[AppMethod.UIKIT_VIEW_SUBMIT]?(
		context: UIKitViewSubmitInteractionContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<IUIKitResponse>;

	/**
	 * Method called when a modal is closed.
	 *
	 * @param context
	 * @param read An accessor to the environment
	 * @param http An accessor to the outside world
	 * @param persistence An accessor to the App's persistence
	 */
	[AppMethod.UIKIT_VIEW_CLOSE]?(
		context: UIKitViewCloseInteractionContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<IUIKitResponse>;

	/**
	 * Method called when an action button is clicked.
	 *
	 * @param context
	 * @param read An accessor to the environment
	 * @param http An accessor to the outside world
	 * @param persistence An accessor to the App's persistence
	 * @param modify An accessor to the App's persistence
	 */
	[AppMethod.UIKIT_ACTION_BUTTON]?(
		context: UIKitActionButtonInteractionContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<IUIKitResponse>;

	/**
	 * Method called when a user opens the app's home; the app can publish the home for that user in response.
	 *
	 * @param context
	 * @param read An accessor to the environment
	 * @param http An accessor to the outside world
	 * @param persistence An accessor to the App's persistence
	 * @param modify An accessor to modify the environment, used to publish the home
	 */
	[AppMethod.UIKIT_APP_HOME_OPENED]?(
		context: UIKitAppHomeOpenedInteractionContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<IUIKitResponse>;
}
