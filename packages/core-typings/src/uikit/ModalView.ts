import type { ButtonElement, ModalSurfaceLayout, TextObject } from '@rocket.chat/ui-kit';

import type { View } from './View';

/**
 * A view that is displayed as a modal dialog.
 */
export type ModalView = View & {
	id: string;
	showIcon?: boolean;
	title: TextObject;
	close?: ButtonElement;
	submit?: ButtonElement;
	blocks: ModalSurfaceLayout;
};
