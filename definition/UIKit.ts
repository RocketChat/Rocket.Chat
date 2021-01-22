import { UIKitInteractionType } from '@rocket.chat/apps-engine/definition/uikit';
import { IBlock } from '@rocket.chat/ui-kit';

export type UiKitPayload = {
	viewId: string;
	appId: string;
	blocks: IBlock[];
}

export type UiKitBannerPayload = UiKitPayload & {
	inline?: boolean;
	variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
	icon?: string;
	title?: string;
}


export type UIKitUserInteraction = {
	type: UIKitInteractionType;
} & UiKitPayload;


export type UiKitBannerProps = {
	payload: UiKitBannerPayload;
};


export type UIKitUserInteractionResult = UIKitUserInteractionResultError | UIKitUserInteraction;

type UIKitUserInteractionResultError = UIKitUserInteraction & {
	type: UIKitInteractionType.ERRORS;
	errors?: Array<{[key: string]: string}>;
};

export const isErrorType = (result: UIKitUserInteractionResult): result is UIKitUserInteractionResultError => result.type === UIKitInteractionType.ERRORS;
