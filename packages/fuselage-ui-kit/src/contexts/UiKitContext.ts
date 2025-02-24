import type {
  ActionableElement,
  InputElementDispatchAction,
} from '@rocket.chat/ui-kit';
import type { MouseEventHandler } from 'react';
import { createContext } from 'react';

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

type UiKitContextValue = {
  action: (
    state: ActionParams,
    event: Parameters<MouseEventHandler<HTMLElement>>[0],
  ) => Promise<void> | void;
  updateState?: (
    state: ActionParams,
    event: Parameters<MouseEventHandler<HTMLElement>>[0],
  ) => Promise<void> | void;
  appId?: string;
  errors?: { [field: string]: string }[] | { [field: string]: string };
  values: Record<ActionId, { value: unknown } | undefined>;
  viewId?: string;
  rid?: string;
};

export const UiKitContext = createContext<UiKitContextValue>({
  action: () => undefined,
  updateState: () => undefined,
  appId: 'core',
  values: {},
});

Object.assign(UiKitContext.Provider, { displayName: 'UiKitContext.Provider' });
