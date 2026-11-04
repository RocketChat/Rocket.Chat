import type * as UiKit from '@rocket.chat/ui-kit';

/** A modal, contextual bar or home view an app opened for a user, kept on the server as the app sent it. */
export interface IUiKitView {
	/** The view id. */
	_id: string;
	appId: string;
	/** The user the view was opened for; only they can submit or close it. */
	userId: string;
	type: 'modal' | 'contextual_bar' | 'home';
	view: UiKit.ModalView | UiKit.ContextualBarView | UiKit.HomeView;
	/** Absent on a home view, which an app keeps until it publishes another. */
	expireAt?: Date;
	_updatedAt: Date;
}
