import type { ButtonElement, ContextualBarSurfaceLayout, TextObject } from '@rocket.chat/ui-kit';

import type { View } from './View';

/**
 * A view that is displayed as a contextual bar.
 */
export type ContextualBarView = View & {
	title: TextObject;
	close?: ButtonElement;
	submit?: ButtonElement;
	blocks: ContextualBarSurfaceLayout;
};
