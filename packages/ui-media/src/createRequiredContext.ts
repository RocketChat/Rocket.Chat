import { createContext, useContext } from 'react';

/** A context with no default: reading it outside its provider is a wiring mistake, so it throws rather than guessing. */
export const createRequiredContext = <T>(name: string) => {
	const Context = createContext<T | undefined>(undefined);
	Context.displayName = name;

	const useRequired = (): T => {
		const value = useContext(Context);
		if (value === undefined) {
			throw new Error(`use${name} must be used within <${name}Provider>`);
		}
		return value;
	};

	return [Context.Provider, useRequired] as const;
};
