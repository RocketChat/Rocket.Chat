import { useMutableCallback, useSafely } from '@rocket.chat/fuselage-hooks';
import * as UiKit from '@rocket.chat/ui-kit';
import { useContext, useMemo, useState } from 'react';

import { kitContext, useUiKitStateValue } from '../contexts/kitContext';

type UiKitState<
  TElement extends UiKit.ActionableElement = UiKit.ActionableElement
> = {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error?: string;
  value: UiKit.ActionOf<TElement>;
};

const hasInitialValue = <TElement extends UiKit.ActionableElement>(
  element: TElement
): element is TElement & { initialValue: number | string } =>
  'initialValue' in element;

const hasInitialOption = <TElement extends UiKit.ActionableElement>(
  element: TElement
): element is TElement & { initialOption: UiKit.Option } =>
  'initialOption' in element;

export const useUiKitState: <TElement extends UiKit.ActionableElement>(
  element: TElement,
  context: UiKit.BlockContext
) => [
  state: UiKitState<TElement>,
  action: (
    pseudoEvent?:
      | Event
      | { target: EventTarget }
      | { target: { value: UiKit.ActionOf<TElement> } }
  ) => void
] = (rest, context) => {
  const { blockId, actionId, appId, dispatchActionConfig } = rest;
  const {
    action,
    appId: appIdFromContext,
    viewId,
    state,
  } = useContext(kitContext);

  const initialValue =
    (hasInitialValue(rest) && rest.initialValue) ||
    (hasInitialOption(rest) && rest.initialOption.value) ||
    undefined;

  const { value: _value, error } = useUiKitStateValue(actionId, initialValue);
  const [value, setValue] = useSafely(useState(_value));
  const [loading, setLoading] = useSafely(useState(false));

  const actionFunction = useMutableCallback(async (e) => {
    const {
      target: { value },
    } = e;
    setLoading(true);
    setValue(value);
    state && (await state({ blockId, appId, actionId, value, viewId }, e));
    await action(
      {
        blockId,
        appId: appId || appIdFromContext,
        actionId,
        value,
        viewId,
      },
      e
    );
    setLoading(false);
  });

  // Used for triggering actions on text inputs. Removing the load state
  // makes the text input field remain focused after running the action
  const noLoadStateActionFunction = useMutableCallback(async (e) => {
    const {
      target: { value },
    } = e;
    setValue(value);
    state && (await state({ blockId, appId, actionId, value, viewId }, e));
    await action(
      {
        blockId,
        appId: appId || appIdFromContext,
        actionId,
        value,
        viewId,
        dispatchActionConfig,
      },
      e
    );
  });

  const stateFunction = useMutableCallback(async (e) => {
    const {
      target: { value },
    } = e;
    setValue(value);
    await state(
      {
        blockId,
        appId: appId || appIdFromContext,
        actionId,
        value,
        viewId,
      },
      e
    );
  });

  const result: UiKitState = useMemo(
    () => ({ loading, setLoading, error, value }),
    [loading, setLoading, error, value]
  );

  if (
    rest.type === 'plain_text_input' &&
    Array.isArray(rest?.dispatchActionConfig) &&
    rest.dispatchActionConfig.includes('on_character_entered')
  ) {
    return [result, noLoadStateActionFunction];
  }

  if (
    (context &&
      [UiKit.BlockContext.SECTION, UiKit.BlockContext.ACTION].includes(
        context
      )) ||
    (Array.isArray(rest?.dispatchActionConfig) &&
      rest.dispatchActionConfig.includes('on_item_selected'))
  ) {
    return [result, actionFunction];
  }

  return [result, stateFunction];
};
