import { UIKitInteractionType as UIKitInteractionTypeApi } from '@rocket.chat/apps-engine/definition/uikit';
import type {
	IDividerBlock,
	ISectionBlock,
	IActionsBlock,
	IContextBlock,
	IInputBlock,
} from '@rocket.chat/apps-engine/definition/uikit/blocks/Blocks';

enum UIKitInteractionTypeExtended {
	BANNER_OPEN = 'banner.open',
	BANNER_UPDATE = 'banner.update',
	BANNER_CLOSE = 'banner.close',
}

export type UIKitInteractionType = UIKitInteractionTypeApi | UIKitInteractionTypeExtended;

export const UIKitInteractionTypes = {
	...UIKitInteractionTypeApi,
	...UIKitInteractionTypeExtended,
};

export type UiKitPayload = {
	viewId: string;
	appId: string;
	blocks: (IDividerBlock | ISectionBlock | IActionsBlock | IContextBlock | IInputBlock)[];
};

export type UiKitBannerPayload = UiKitPayload & {
	inline?: boolean;
	variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
	icon?: string;
	title?: string;
};

export type UIKitUserInteraction = {
	type: UIKitInteractionType;
} & UiKitPayload;

export type UiKitBannerProps = {
	payload: UiKitBannerPayload;
};

export type UIKitUserInteractionResult = UIKitUserInteractionResultError | UIKitUserInteraction;

type UIKitUserInteractionResultError = UIKitUserInteraction & {
	type: UIKitInteractionTypeApi.ERRORS;
	errors?: Array<{ [key: string]: string }>;
};

export const isErrorType = (result: UIKitUserInteractionResult): result is UIKitUserInteractionResultError =>
	result.type === UIKitInteractionTypeApi.ERRORS;

export type UIKitActionEvent = {
	blockId: string;
	value?: unknown;
	appId: string;
	actionId: string;
	viewId: string;
};
