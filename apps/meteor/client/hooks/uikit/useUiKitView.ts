import { useSafely } from '@rocket.chat/fuselage-hooks';
import type * as UiKit from '@rocket.chat/ui-kit';
import { useEffect, useState } from 'react';

import { useUiKitActionManager } from './useUiKitActionManager';

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
};

export function useUiKitView<S extends UiKit.View>(initialView: S): UseUiKitViewReturnType<S> {
	const [errors, setErrors] = useSafely(useState<{ [field: string]: string }[] | undefined>());
	const [view, updateView] = useSafely(useState(initialView));
	const actionManager = useUiKitActionManager();

	const viewId = getViewId(view);

	useEffect(() => {
		const handleUpdate = (interaction: UiKit.ServerInteraction): void => {
			if (interaction.type === 'errors') {
				setErrors(interaction.errors);
				return;
			}

			updateView((view) => ({ ...view, ...getViewFromInteraction(interaction) }));
		};

		actionManager.on(viewId, handleUpdate);

		return (): void => {
			actionManager.off(viewId, handleUpdate);
		};
	}, [actionManager, setErrors, updateView, viewId]);

	return { view, errors };
}
