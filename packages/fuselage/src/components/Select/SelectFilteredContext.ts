import type { Dispatch, SetStateAction } from 'react';
import { createContext } from 'react';

export const SelectFilteredContext = createContext<{
	placeholder?: string;
	filter?: string;
	setFilter?: Dispatch<SetStateAction<string>>;
}>({});
