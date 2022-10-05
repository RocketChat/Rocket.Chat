import type { InputElementDispatchAction } from '@rocket.chat/ui-kit';
import { createContext, useContext } from 'react';

type ActionParams = {
  blockId: string;
  appId: string;
  actionId: string;
  value: unknown;
  viewId?: string;
  dispatchActionConfig?: InputElementDispatchAction[];
};

type UiKitContext = {
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
};

export const defaultContext = {
  action: console.log,
  state: console.log,
  appId: 'core',
  errors: {},
  values: {},
};

export const kitContext = createContext<UiKitContext>(defaultContext);

export const useUiKitContext = () => useContext(kitContext);

export const useUiKitStateValue = <T extends string | number | undefined>(
  actionId: string,
  initialValue: T
): {
  value: T;
  error: string | undefined;
} => {
  const { values, errors } = useUiKitContext();

  return {
    value: (values && (values[actionId]?.value as T)) ?? initialValue,
    error: errors && errors[actionId],
  };
};
