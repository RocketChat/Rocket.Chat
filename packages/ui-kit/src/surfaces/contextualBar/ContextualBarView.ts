import typia from 'typia';

import type { TextObject } from '../../blocks/TextObject.js';
import type { ButtonElement } from '../../blocks/elements/ButtonElement.js';
import type { View } from '../View.js';
import type { ContextualBarSurfaceLayout } from './UiKitParserContextualBar.js';

/**
 * A view that is displayed as a contextual bar.
 */
// Omitting `blocks` from `View` because array intersections are weird
export type ContextualBarView = Omit<View, 'blocks'> & {
	id: string;
	title: TextObject;
	close?: ButtonElement;
	submit?: ButtonElement;
	blocks: ContextualBarSurfaceLayout;
};

export const isContextualBarView = typia.createIs<ContextualBarView>();
