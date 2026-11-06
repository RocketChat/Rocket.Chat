import { useRef, useCallback } from 'preact/hooks';

export const useStableCallback = <TFunction extends (...args: any[]) => unknown>(callback: TFunction): TFunction => {
	const callbackRef = useRef<TFunction>(callback);

	callbackRef.current = callback;

	return useCallback(((...args) => callbackRef.current(...args)) as TFunction, []);
};
