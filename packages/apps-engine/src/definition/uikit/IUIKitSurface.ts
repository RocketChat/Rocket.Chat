import type { ButtonElement, LayoutBlock, TextObject } from '@rocket.chat/ui-kit';

import type { IBlock, IButtonElement, ITextObject } from './blocks';

export enum UIKitSurfaceType {
	MODAL = 'modal',
	HOME = 'home',
	CONTEXTUAL_BAR = 'contextualBar',
}

export interface IUIKitSurface {
	appId: string;
	id: string;
	type: UIKitSurfaceType;
	title: ITextObject | TextObject;
	blocks: Array<IBlock | LayoutBlock>;
	close?: IButtonElement | ButtonElement;
	submit?: IButtonElement | ButtonElement;
	state?: object;
	clearOnClose?: boolean;
	notifyOnClose?: boolean;
	/** Data the app gets back when the view is submitted or closed; kept on the server, never shown to the user. */
	private_metadata?: string;
	callback_id?: string;
	/** Lets the app update the view without knowing its `id`; unique among the views the app opened for a user. */
	external_id?: string;
	submit_disabled?: boolean;
	/** Set by the host on every save; an update carrying a different `hash` is stale and is dropped. */
	hash?: string;
}
