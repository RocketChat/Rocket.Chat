import { useEffectEvent, useSafely } from '@rocket.chat/fuselage-hooks';
import * as UiKit from '@rocket.chat/ui-kit';
import { useContext, useState } from 'react';

import { UiKitContext } from '../contexts/UiKitContext';
import { getInitialValue } from '../utils/getInitialValue';

const getElementValueFromState = (
  actionId: string,
  values: Record<
    string,
    | {
        value: unknown;
      }
    | undefined
  >,
  initialValue: unknown,
) => {
  return (values?.[actionId]?.value as unknown) ?? initialValue;
};

export const useUiKitState = <TElement extends UiKit.ActionableElement>(
  element: TElement,
  context: UiKit.BlockContext,
) => {
  const { blockId, actionId, appId, dispatchActionConfig } = element;
  const {
    action,
    appId: appIdFromContext = undefined,
    viewId = undefined,
    updateState,
  } = useContext(UiKitContext);

  const initialValue = getInitialValue(element);

  const { values, errors } = useContext(UiKitContext);

  const _value = getElementValueFromState(actionId, values, initialValue);
  const error = Array.isArray(errors)
    ? errors.find((error) =>
        Object.keys(error).find((key) => key === actionId),
      )?.[actionId]
    : errors?.[actionId];

  const [value, setValue] = useSafely(useState(_value));
  const [loading, setLoading] = useSafely(useState(false));

  const mutate = useEffectEvent((newValue: unknown) => {
    if (Array.isArray(value)) {
      if (Array.isArray(newValue)) {
        setValue(newValue);
      } else {
        const idx = value.findIndex((value) => value === newValue);

        if (idx > -1) {
          setValue(value.filter((_, i) => i !== idx));
        } else {
          setValue([...value, newValue]);
        }
      }
    } else {
      setValue(newValue);
    }

    updateState?.({ blockId, appId, actionId, value: newValue, viewId });
  });

  const performAction = useEffectEvent(async (value) => {
    setLoading(true);

    await action({
      blockId,
      appId: appId || appIdFromContext || 'core',
      actionId,
      value,
      viewId,
      dispatchActionConfig,
    });

    setLoading(false);
  });

  const actionFunction = useEffectEvent(async (e) => {
    const {
      target: { value: elValue },
    } = e;

    setLoading(true);

    if (Array.isArray(value)) {
      if (Array.isArray(elValue)) {
        setValue(elValue);
      } else {
        const idx = value.findIndex((value) => value === elValue);

        if (idx > -1) {
          setValue(value.filter((_, i) => i !== idx));
        } else {
          setValue([...value, elValue]);
        }
      }
    } else {
      setValue(elValue);
    }

    updateState?.({ blockId, appId, actionId, value: elValue, viewId });
    await action({
      blockId,
      appId: appId || appIdFromContext || 'core',
      actionId,
      value: elValue,
      viewId,
    });
    setLoading(false);
  });

  const stateFunction = useEffectEvent(async (e) => {
    const {
      target: { value },
    } = e;

    setValue(value);

    updateState?.({
      blockId,
      appId: appId || appIdFromContext || 'core',
      actionId,
      value,
      viewId,
    });
  });

  const handleEvent = useEffectEvent(async (e) => {
    if (
      (context &&
        [UiKit.BlockContext.SECTION, UiKit.BlockContext.ACTION].includes(
          context,
        )) ||
      (Array.isArray(element?.dispatchActionConfig) &&
        element.dispatchActionConfig.includes('on_item_selected'))
    ) {
      return actionFunction(e);
    }

    return stateFunction(e);
  });

  return [
    {
      loading,
      error,
      value: value as UiKit.ActionOf<TElement>,
      mutate,
      performAction,
    },
    handleEvent as (
      pseudoEvent?:
        | Event
        | { target: EventTarget }
        | { target: { value: UiKit.ActionOf<TElement> } },
    ) => Promise<void>,
  ] as const;
};
