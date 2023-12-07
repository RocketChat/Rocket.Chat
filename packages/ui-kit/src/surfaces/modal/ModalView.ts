import typia from 'typia';

import type { TextObject } from '../../blocks/TextObject';
import type { ButtonElement } from '../../blocks/elements/ButtonElement';
import type { View } from '../View';
import type { ModalSurfaceLayout } from './UiKitParserModal';

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
