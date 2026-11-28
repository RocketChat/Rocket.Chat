import type { IHttp, IModify, IPersistence, IRead } from '../../accessors';
import type { AppMethod } from '../../metadata';
import type { IUIKitResponse } from '../IUIKitInteractionType';
import type {
	UIKitLivechatBlockInteractionContext,
	UIKitLivechatViewCloseInteractionContext,
	UIKitLivechatViewSubmitInteractionContext,
} from './UIKitLivechatInteractionContext';

/** Handler for UIKit interactions in the livechat widget. */
export interface IUIKitLivechatInteractionHandler {
	/**
	 * Method called when a block action is invoked.
	 *
	 * @param context
	 * @param read An accessor to the environment
	 * @param http An accessor to the outside world
	 * @param persistence An accessor to the App's persistence
	 */
	[AppMethod.UIKIT_LIVECHAT_BLOCK_ACTION]?(
		context: UIKitLivechatBlockInteractionContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<IUIKitResponse>;

	/** Method called when a visitor submits a modal view. */
	[AppMethod.UIKIT_LIVECHAT_VIEW_SUBMIT]?(
		context: UIKitLivechatViewSubmitInteractionContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<IUIKitResponse>;

	/** Method called when a visitor closes a modal view. */
	[AppMethod.UIKIT_LIVECHAT_VIEW_CLOSE]?(
		context: UIKitLivechatViewCloseInteractionContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<IUIKitResponse>;
}
