import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import { useEffect, useRef, Ref, useCallback, RefCallback } from 'react';

export const useBlazeTemplate = <TParent extends Element, TData = any>(template: Blaze.Template<TData>, data: TData): Ref<TParent> => {
	const dataRef = useRef(new ReactiveVar(data));
	useEffect(() => {
		if (data) {
			dataRef.current.set(data);
		}
	});

	const viewRef = useRef<Blaze.View | undefined>(undefined);

	const ref: RefCallback<TParent> = useCallback(
		(current: Element | null) => {
			if (!current) {
				if (viewRef.current) {
					Blaze.remove(viewRef.current);
					viewRef.current = undefined;
				}
				return;
			}

			viewRef.current = Blaze.renderWithData(template, () => dataRef.current.get(), current);
		},
		[template],
	);

	return ref;
};
