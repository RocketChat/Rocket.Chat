import type { InputElementDispatchAction } from '@rocket.chat/ui-kit';
import { createContext } from 'react';

type ActionParams = {
  blockId: string;
  appId: string;
  actionId: string;
  value: unknown;
  viewId?: string;
  dispatchActionConfig?: InputElementDispatchAction[];
  mid?: string;
};

type UiKitContextValue = {
  action: (
    state: ActionParams,
    event: Parameters<React.MouseEventHandler<HTMLElement>>[0]
  ) => Promise<void> | void;
  updateState?: (
    state: ActionParams,
    event: Parameters<React.MouseEventHandler<HTMLElement>>[0]
  ) => Promise<void> | void;
  payload: {
    appId: string;
    viewId: string;
  };
  values?: Record<string, { value: string } | undefined>;
  errors?: Record<string, string>;
  rid?: string;
};

export const UiKitContext = createContext<UiKitContextValue>({
  action: () => undefined,
  updateState: () => undefined,
  errors: {},
  payload: {
    appId: 'core',
    viewId: 'default',
  },
});
