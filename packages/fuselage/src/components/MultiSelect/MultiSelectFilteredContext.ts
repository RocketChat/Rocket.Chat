import { createContext, type Dispatch, type SetStateAction } from 'react';

export const MultiSelectFilteredContext = createContext<{
	placeholder?: string;
	filter?: string;
	setFilter?: Dispatch<SetStateAction<string>>;
}>({});
