import type {
  ActionableElement,
  InputElementDispatchAction,
} from '@rocket.chat/ui-kit';
import { createContext } from 'react';

type ActionId = ActionableElement['actionId'];

type ActionParams = {
  blockId: string;
  appId: string;
  actionId: ActionId;
  value: unknown;
  viewId?: string;
  dispatchActionConfig?: InputElementDispatchAction[];
};

type UiKitContextValue = {
  action: (
    state: ActionParams,
    event: Parameters<React.MouseEventHandler<HTMLElement>>[0]
  ) => Promise<void> | void;
  state: (
    state: ActionParams,
    event: Parameters<React.MouseEventHandler<HTMLElement>>[0]
  ) => Promise<void> | void;
  appId: string;
  errors?: Record<string, string>;
  values: Record<ActionId, { value: unknown } | undefined>;
  viewId?: string;
  rid?: string;
};

export const UiKitContext = createContext<UiKitContextValue>({
  action: () => undefined,
  state: () => undefined,
  appId: 'core',
  errors: {},
  values: {},
});
