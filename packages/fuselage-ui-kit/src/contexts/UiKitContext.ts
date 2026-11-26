import type { ActionableElement, BlockSuggestionResponse, InputElementDispatchAction } from '@rocket.chat/ui-kit';
import type { MouseEventHandler } from 'react';
import { createContext } from 'react';

import type { UiKitViewState } from '../utils/createUiKitViewState';

type ActionId = ActionableElement['actionId'];

type ActionParams = {
	blockId: string;
	appId: string;
	actionId: ActionId;
	value: unknown;
	viewId?: string;
	dispatchActionConfig?: InputElementDispatchAction[];
	mid?: string;
};

type SuggestParams = Pick<ActionParams, 'blockId' | 'appId' | 'actionId' | 'viewId' | 'mid'> & {
	/** What the user has typed so far. */
	value: string;
};

type UiKitContextValue = {
	action: (state: ActionParams, event: Parameters<MouseEventHandler<HTMLElement>>[0]) => Promise<void> | void;
	suggest?: (params: SuggestParams) => Promise<BlockSuggestionResponse>;
	appId?: string;
	errors?: { [field: string]: string }[] | { [field: string]: string };
	/** Absent on surfaces with no view state, such as messages; elements then keep their value to themselves. */
	viewState?: UiKitViewState;
	viewId?: string;
	rid?: string;
	/** Absent when the surface cannot store files; `file_input` then renders disabled. */
	uploadFile?: (file: File) => Promise<{ _id: string; name: string }>;
};

export const UiKitContext = createContext<UiKitContextValue>({
	action: () => undefined,
	appId: 'core',
});

Object.assign(UiKitContext.Provider, { displayName: 'UiKitContext.Provider' });
