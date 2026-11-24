import { useSafely } from '@rocket.chat/fuselage-hooks';
import { extractInitialStateFromLayout } from '@rocket.chat/fuselage-ui-kit';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { Dispatch } from 'react';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';

import { useUiKitActionManager } from './useUiKitActionManager';

type Values = { [actionId: string]: { value: unknown; blockId?: string } };

type ValuesAction =
	{ type: 'update'; actionId: string; payload: { value: unknown; blockId?: string } } | { type: 'reseed'; blocks: UiKit.LayoutBlock[] };

// When the app replaces the blocks, an element that stays keeps what the user entered.
const reseedValues = (values: Values, blocks: UiKit.LayoutBlock[]): Values =>
	Object.fromEntries(
		Object.entries(extractInitialStateFromLayout(blocks)).map(([actionId, seeded]) => {
			const current = values[actionId];
			return [actionId, current ? { value: current.value, blockId: seeded.blockId ?? current.blockId } : seeded];
		}),
	);

const reduceValues = (values: Values, action: ValuesAction): Values => {
	switch (action.type) {
		case 'update':
			return { ...values, [action.actionId]: action.payload };

		case 'reseed':
			return reseedValues(values, action.blocks);
	}
};

const getViewId = (view: UiKit.View): string => {
	if ('id' in view && typeof view.id === 'string') {
		return view.id;
	}

	if ('viewId' in view && typeof view.viewId === 'string') {
		return view.viewId;
	}

	throw new Error('Invalid view');
};

const getViewFromInteraction = (interaction: UiKit.ServerInteraction): UiKit.View | undefined => {
	if ('view' in interaction && typeof interaction.view === 'object') {
		return interaction.view;
	}

	if (interaction.type === 'banner.open') {
		return interaction;
	}

	return undefined;
};

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
	const [values, dispatchValues] = useSafely(useReducer(reduceValues, initialView.blocks, extractInitialStateFromLayout));
	const updateValues = useCallback(
		({ actionId, payload }: { actionId: string; payload: { value: unknown; blockId?: string } }) =>
			dispatchValues({ type: 'update', actionId, payload }),
		[dispatchValues],
	);
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

	const viewId = getViewId(view);

	useEffect(() => {
		const handleUpdate = (interaction: UiKit.ServerInteraction): void => {
			if (interaction.type === 'errors') {
				setErrors(interaction.errors);
				return;
			}

			const update = getViewFromInteraction(interaction);
			updateView((view) => ({ ...view, ...update }));

			if (update?.blocks) {
				dispatchValues({ type: 'reseed', blocks: update.blocks });
			}
		};

		actionManager.on(viewId, handleUpdate);

		return (): void => {
			actionManager.off(viewId, handleUpdate);
		};
	}, [actionManager, setErrors, updateView, dispatchValues, viewId]);

	return { view, errors, values, updateValues, state };
}
