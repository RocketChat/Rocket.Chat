import typia from 'typia';

import type { TextObject } from '../../blocks/TextObject.js';
import type { ButtonElement } from '../../blocks/elements/ButtonElement.js';
import type { View } from '../View.js';
import type { ModalSurfaceLayout } from './UiKitParserModal.js';

/**
 * A view that is displayed as a modal dialog.
 */
// Omitting `blocks` from `View` because array intersections are weird
export type ModalView = Omit<View, 'blocks'> & {
	id: string;
	showIcon?: boolean;
	title: TextObject;
	close?: ButtonElement;
	submit?: ButtonElement;
	blocks: ModalSurfaceLayout;
	/** Data the app wants back when the view is submitted or closed. Kept on the server, never shown to the user. */
	private_metadata?: string;
	/** An id the app picks to recognize the view in its handlers. */
	callback_id?: string;
	/** An id the app picks, unique among the views it opened for a user, to update the view without knowing its `id`. */
	external_id?: string;
	/** Disables the submit button. */
	submit_disabled?: boolean;
	/** Set by the server on every save; an update that carries a different `hash` is stale and is dropped. */
	hash?: string;
	/** Closing the view closes every modal the app has open. */
	clearOnClose?: boolean;
	/** Whether closing the view sends `viewClosed` to the app. Defaults to `true`. */
	notifyOnClose?: boolean;
};

export const isModalView = typia.createIs<ModalView>();
