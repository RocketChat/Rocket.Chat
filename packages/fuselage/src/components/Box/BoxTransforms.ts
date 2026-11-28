import { createContext, useContext, useMemo } from 'react';

import type { BoxProps } from './Box';

export type BoxTransformProps = BoxProps & { className?: string };

type BoxTransform = (props: BoxTransformProps) => BoxTransformProps;

export const BoxTransforms = createContext<null | ((props: any) => any)>(null);

export const useBoxTransform = () => useContext(BoxTransforms);

export const useComposedBoxTransform = (fn: BoxTransform) => {
	const parentFn = useContext(BoxTransforms);

	return useMemo(() => {
		if (!parentFn) {
			return fn;
		}

		if (!fn) {
			return parentFn;
		}

		return (props: BoxTransformProps) => fn(parentFn(props));
	}, [fn, parentFn]);
};
