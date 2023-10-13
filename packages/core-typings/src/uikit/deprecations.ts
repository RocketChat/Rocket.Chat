import { UIKitInteractionType as UIKitInteractionTypeApi } from '@rocket.chat/apps-engine/definition/uikit';

import type { View } from './View';

enum UIKitInteractionTypeExtended {
	MODAL_OPEN = 'modal.open',
	MODAL_CLOSE = 'modal.close',
	MODAL_UPDATE = 'modal.update',
	CONTEXTUAL_BAR_OPEN = 'contextual_bar.open',
	CONTEXTUAL_BAR_CLOSE = 'contextual_bar.close',
	CONTEXTUAL_BAR_UPDATE = 'contextual_bar.update',
	ERRORS = 'errors',
	BANNER_OPEN = 'banner.open',
	BANNER_UPDATE = 'banner.update',
	BANNER_CLOSE = 'banner.close',
}

export type UIKitInteractionType = UIKitInteractionTypeApi | UIKitInteractionTypeExtended;

export type UIKitUserInteraction = {
	type: UIKitInteractionType;
} & View;

export type UIKitUserInteractionResult = UIKitUserInteractionResultError | UIKitUserInteraction;

type UIKitUserInteractionResultError = UIKitUserInteraction & {
	type: UIKitInteractionTypeApi.ERRORS;
	errors?: Array<{ [key: string]: string }>;
};

export const isErrorType = (result: UIKitUserInteractionResult): result is UIKitUserInteractionResultError =>
	result.type === UIKitInteractionTypeApi.ERRORS;
