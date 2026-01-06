import { useEffectEvent, useSafely } from '@rocket.chat/fuselage-hooks';
import { BlockContext } from '@rocket.chat/ui-kit';
import type { ActionOf, ActionableElement } from '@rocket.chat/ui-kit';
import { useContext, useMemo, useState } from 'react';

import { UiKitContext } from '../contexts/UiKitContext';
import { getInitialValue } from '../utils/getInitialValue';

const getElementValueFromState = <TValue>(
	actionId: string,
	values: Record<
		string,
		| {
				value: unknown;
		  }
		| undefined
	>,
	initialValue: TValue,
) => (values && (values[actionId]?.value as TValue)) ?? initialValue;

type UiKitState<TElement extends ActionableElement = ActionableElement> = {
	loading: boolean;
	setLoading: (loading: boolean) => void;
	error?: string;
	value: ActionOf<TElement>;
};

export const useUiKitState = <TElement extends ActionableElement>(
	element: TElement,
	context: BlockContext,
): [
	state: UiKitState<TElement>,
	action: (pseudoEvent?: Event | { target: EventTarget } | { target: { value: ActionOf<TElement> } }) => Promise<void>,
] => {
	const { blockId, actionId, appId, dispatchActionConfig } = element;
	const { action, appId: appIdFromContext = undefined, viewId = undefined, updateState } = useContext(UiKitContext);

	const initialValue = getInitialValue(element) as ActionOf<TElement>;

	const { values, errors } = useContext(UiKitContext);

	const _value = getElementValueFromState<ActionOf<TElement>>(actionId, values, initialValue);
	const error = Array.isArray(errors)
		? errors.find((error) => Object.keys(error).find((key) => key === actionId))?.[actionId]
		: errors?.[actionId];

	const [value, setValue] = useSafely(useState<ActionOf<TElement>>(_value));
	const [loading, setLoading] = useSafely(useState(false));

	const actionFunction = useEffectEvent(async (e: any) => {
		// FIXME: fix typings
		const {
			target: { value: elValue },
		} = e;

		setLoading(true);

		const setActionValue = (nextValue: ActionOf<TElement>) => setValue(nextValue);
		if (Array.isArray(value)) {
			if (Array.isArray(elValue)) {
				setActionValue(elValue as ActionOf<TElement>);
			} else {
				const idx = value.findIndex((value) => value === elValue);

				if (idx > -1) {
					setActionValue(value.filter((_, i) => i !== idx) as ActionOf<TElement>);
				} else {
					setActionValue([...value, elValue] as ActionOf<TElement>);
				}
			}
		} else {
			setActionValue(elValue as ActionOf<TElement>);
		}

		await updateState?.({ blockId, appId, actionId, value: elValue, viewId }, e);
		await action(
			{
				blockId,
				appId: appId || appIdFromContext || 'core',
				actionId,
				value: elValue,
				viewId,
			},
			e,
		);
		setLoading(false);
	});

	// Used for triggering actions on text inputs. Removing the load state
	// makes the text input field remain focused after running the action
	const noLoadStateActionFunction = useEffectEvent(async (e: any) => {
		// FIXME: fix typings
		const {
			target: { value },
		} = e;
		setValue(value as ActionOf<TElement>);

		updateState && (await updateState({ blockId, appId, actionId, value, viewId }, e));

		await action(
			{
				blockId,
				appId: appId || appIdFromContext || 'core',
				actionId,
				value,
				viewId,
				dispatchActionConfig,
			},
			e,
		);
	});

	const stateFunction = useEffectEvent(async (e: any) => {
		// FIXME: fix typings
		const {
			target: { value },
		} = e;

		setValue(value as ActionOf<TElement>);

		await updateState?.(
			{
				blockId,
				appId: appId || appIdFromContext || 'core',
				actionId,
				value,
				viewId,
			},
			e,
		);
	});

	const result: UiKitState = useMemo(() => ({ loading, setLoading, error, value }), [loading, setLoading, error, value]);

	if (
		element.type === 'plain_text_input' &&
		Array.isArray(element?.dispatchActionConfig) &&
		element.dispatchActionConfig.includes('on_character_entered')
	) {
		return [result, noLoadStateActionFunction];
	}

	if (element.type === 'file_upload') {
		return [result, actionFunction];
	}

	if (
		(context && [BlockContext.SECTION, BlockContext.ACTION].includes(context)) ||
		(Array.isArray(element?.dispatchActionConfig) && element.dispatchActionConfig.includes('on_item_selected'))
	) {
		return [result, actionFunction];
	}

	return [result, stateFunction];
};
