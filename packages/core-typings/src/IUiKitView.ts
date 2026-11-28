import type * as UiKit from '@rocket.chat/ui-kit';

/** A modal, contextual bar or banner view an app opened for a user, kept on the server as the app sent it. */
export interface IUiKitView {
	_id: string;
	/** The id the app gave the view; unique only per app and user. */
	viewId: string;
	appId: string;
	/** The user the view was opened for; only they can submit or close it. */
	userId: string;
	type: 'modal' | 'contextual_bar' | 'banner';
	view: UiKit.ModalView | UiKit.ContextualBarView | UiKit.BannerView;
	expireAt: Date;
	_updatedAt: Date;
}
