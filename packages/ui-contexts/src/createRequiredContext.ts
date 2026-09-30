import type { Provider } from 'react';
import { createContext, useContext } from 'react';

/**
 * Creates a context with no default value: reading it outside its provider throws instead of silently getting a fake
 * implementation.
 */
export const createRequiredContext = <T>(displayName: string): readonly [Provider<T>, () => T] => {
	const Context = createContext<T | undefined>(undefined);
	Context.displayName = displayName;

	const useRequiredContext = (): T => {
		const value = useContext(Context);

		if (value === undefined) {
			throw new Error(`${displayName} is not available: render this component inside its provider`);
		}

		return value;
	};

	return [Context.Provider as Provider<T>, useRequiredContext] as const;
};
