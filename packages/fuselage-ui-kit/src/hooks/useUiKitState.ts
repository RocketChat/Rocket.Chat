import { useStableCallback, useSafely } from '@rocket.chat/fuselage-hooks';
import * as UiKit from '@rocket.chat/ui-kit';
import { useContext, useMemo, useState } from 'react';

import { useStringFromTextObject } from './useStringFromTextObject';
import { UiKitContext } from '../contexts/UiKitContext';
import { askConfirmation } from '../utils/askConfirmation';
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
	initialValue: string | number | string[] | undefined,
) => (values && (values[actionId]?.value as string | number | string[] | undefined)) ?? initialValue;

type UiKitState<TElement extends UiKit.ActionableElement = UiKit.ActionableElement> = {
	loading: boolean;
	setLoading: (loading: boolean) => void;
	error?: string;
	value: UiKit.ActionOf<TElement>;
};

export const useUiKitState = <TElement extends UiKit.ActionableElement>(
	element: TElement,
	context: UiKit.BlockContext,
): [
	state: UiKitState<TElement>,
	action: (
		pseudoEvent?:
			Event | { target: EventTarget; onConfirmed?: () => void } | { target: { value: UiKit.ActionOf<TElement> }; onConfirmed?: () => void },
	) => Promise<void>,
] => {
	const { blockId, actionId, appId, dispatchActionConfig, confirm } = element;
	const fromTextObjectToString = useStringFromTextObject();
	const { action, appId: appIdFromContext = undefined, viewId = undefined, updateState } = useContext(UiKitContext);

	const initialValue = getInitialValue(element);

	const { values, errors } = useContext(UiKitContext);

	const _value = getElementValueFromState(actionId, values, initialValue);
	const error = Array.isArray(errors)
		? errors.find((error) => Object.keys(error).find((key) => key === actionId))?.[actionId]
		: errors?.[actionId];

	const [value, setValue] = useSafely(useState(_value));
	const [loading, setLoading] = useSafely(useState(false));

	const actionFunction = useStableCallback(async (e: any) => {
		// FIXME: fix typings
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
	const noLoadStateActionFunction = useStableCallback(async (e: any) => {
		// FIXME: fix typings
		const {
			target: { value },
		} = e;
		setValue(value);

		if (updateState) {
			await updateState({ blockId, appId, actionId, value, viewId }, e);
		}

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

	const stateFunction = useStableCallback(async (e: any) => {
		// FIXME: fix typings
		const {
			target: { value },
		} = e;

		setValue(value);

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

	const isAccepted = async () =>
		!confirm ||
		askConfirmation({
			title: fromTextObjectToString(confirm.title) ?? '',
			text: fromTextObjectToString(confirm.text) ?? '',
			confirm: fromTextObjectToString(confirm.confirm) ?? '',
			deny: fromTextObjectToString(confirm.deny) ?? '',
			style: confirm.style,
		});

	const confirmedAction = useStableCallback(async (e: any) => {
		if (await isAccepted()) {
			e?.onConfirmed?.();
			await actionFunction(e);
		}
	});

	const confirmedNoLoadStateAction = useStableCallback(async (e: any) => {
		if (await isAccepted()) {
			await noLoadStateActionFunction(e);
		}
	});

	const result: UiKitState = useMemo(() => ({ loading, setLoading, error, value }), [loading, setLoading, error, value]);

	if (
		element.type === 'plain_text_input' &&
		Array.isArray(element?.dispatchActionConfig) &&
		element.dispatchActionConfig.includes('on_character_entered')
	) {
		return [result, confirmedNoLoadStateAction];
	}

	if (context === UiKit.BlockContext.SECTION || context === UiKit.BlockContext.ACTION) {
		return [result, confirmedAction];
	}

	if (Array.isArray(element?.dispatchActionConfig) && element.dispatchActionConfig.includes('on_item_selected')) {
		return [result, confirmedAction];
	}

	return [result, stateFunction];
};
