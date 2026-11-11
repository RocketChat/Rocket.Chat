import { createContext, useContext, useMemo } from 'react';

export const BoxTransforms = createContext<null | ((props: any) => any)>(null);

export const useBoxTransform = () => useContext(BoxTransforms);

export const useComposedBoxTransform = (fn: (props: any) => any) => {
	const parentFn = useContext(BoxTransforms);

	return useMemo(() => {
		if (!parentFn) {
			return fn;
		}

		if (!fn) {
			return parentFn;
		}

		return (props: any) => fn(parentFn(props));
	}, [fn, parentFn]);
};
