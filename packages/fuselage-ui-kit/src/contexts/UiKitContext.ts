import type { InputElementDispatchAction } from '@rocket.chat/ui-kit';
import { createContext } from 'react';

type ActionParams = {
  blockId: string;
  appId: string;
  actionId: string;
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
  values: Record<string, { value: string } | undefined>;
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
