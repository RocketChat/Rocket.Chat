import type { UIKitUserInteractionResult, UiKit } from '@rocket.chat/core-typings';
import { isErrorType } from '@rocket.chat/core-typings';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { extractInitialStateFromLayout } from '@rocket.chat/fuselage-ui-kit';
import type { Dispatch } from 'react';
import { useEffect, useMemo, useReducer, useState } from 'react';

import { useUiKitActionManager } from './useUiKitActionManager';

const reduceValues = (
	values: { [actionId: string]: { value: unknown; blockId?: string } },
	{ actionId, payload }: { actionId: string; payload: { value: unknown; blockId?: string } },
): { [actionId: string]: { value: unknown; blockId?: string } } => ({
	...values,
	[actionId]: payload,
});

type UseUiKitViewReturnType<TView extends UiKit.View> = {
	view: TView;
	errors?: { [field: string]: string }[];
	values: { [actionId: string]: { value: unknown; blockId?: string } };
	updateValues: Dispatch<{ actionId: string; payload: { value: unknown; blockId?: string } }>;
	state: {
		[blockId: string]: {
			[key: string]: unknown;
		};
	};
};

export function useUiKitView<S extends UiKit.View>(initialView: S): UseUiKitViewReturnType<S> {
	const [errors, setErrors] = useSafely(useState<{ [field: string]: string }[] | undefined>());
	const [values, updateValues] = useSafely(useReducer(reduceValues, initialView.blocks, extractInitialStateFromLayout));
	const [view, updateView] = useSafely(useState(initialView));
	const actionManager = useUiKitActionManager();

	const state = useMemo(() => {
		return Object.entries(values).reduce<{ [blockId: string]: { [actionId: string]: unknown } }>((obj, [key, payload]) => {
			if (!payload?.blockId) {
				return obj;
			}

			const { blockId, value } = payload;
			obj[blockId] = obj[blockId] || {};
			obj[blockId][key] = value;

			return obj;
		}, {});
	}, [values]);

	const { viewId } = view;

	useEffect(() => {
		const handleUpdate = (data: UIKitUserInteractionResult): void => {
			if (isErrorType(data)) {
				setErrors(data.errors);
				return;
			}

			const { type, ...rest } = data;
			updateView((view) => ({ ...view, ...rest }));
		};

		actionManager.on(viewId, handleUpdate);

		return (): void => {
			actionManager.off(viewId, handleUpdate);
		};
	}, [actionManager, setErrors, updateView, viewId]);

	return { view, errors, values, updateValues, state };
}
