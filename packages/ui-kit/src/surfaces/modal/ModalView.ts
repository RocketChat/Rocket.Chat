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
};

export const isModalView = typia.createIs<ModalView>();
