import type { ButtonElement, LayoutBlock, TextObject } from '@rocket.chat/ui-kit';

import type { IBlock, IButtonElement, ITextObject } from './blocks';

/** Where an App's blocks are rendered. */
export enum UIKitSurfaceType {
	/** A dialog over the workspace, which the user has to close to carry on. */
	MODAL = 'modal',
	/** The App's own page. */
	HOME = 'home',
	/** A panel beside the room, which stays open while the user reads. */
	CONTEXTUAL_BAR = 'contextualBar',
}

/**
 * A view an App renders out of UIKit blocks.
 *
 * Open one with `IUIController.openSurfaceView`. What the user typed comes
 * back in `IUIKitViewSubmitIncomingInteraction`, keyed by each input's block
 * and action id.
 */
export interface IUIKitSurface {
	/** The App the surface belongs to. */
	appId: string;
	/** The surface's identifier, which an update has to repeat. */
	id: string;
	/** Which kind of surface to render. */
	type: UIKitSurfaceType;
	/** The surface's heading. */
	title: ITextObject | TextObject;
	/** What the surface shows. */
	blocks: Array<IBlock | LayoutBlock>;
	/** The button that dismisses the surface. */
	close?: IButtonElement | ButtonElement;
	/** The button that submits the surface. Without it nothing can be submitted. */
	submit?: IButtonElement | ButtonElement;
	/** Values to seed the surface's inputs with. */
	state?: object;
	/** Whether closing the surface discards what the user typed. */
	clearOnClose?: boolean;
	/** Whether the App's `IUIKitInteractionHandler` hears about the surface being closed. */
	notifyOnClose?: boolean;
}
