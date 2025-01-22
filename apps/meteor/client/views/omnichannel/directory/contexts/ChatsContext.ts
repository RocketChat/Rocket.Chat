import type { RefObject, SetStateAction } from 'react';
import { createContext, useContext } from 'react';

export type ChatsFiltersQuery = {
	guest: string;
	servedBy: string;
	status: string;
	department: string;
	from: string;
	to: string;
	tags: { _id: string; label: string; value: string }[];
	[key: string]: unknown;
};

export const initialValues: ChatsFiltersQuery = {
	guest: '',
	servedBy: 'all',
	status: 'all',
	department: 'all',
	from: '',
	to: '',
	tags: [],
};

export type ChatsContextValue = {
	filtersQuery: ChatsFiltersQuery;
	setFiltersQuery: (value: SetStateAction<ChatsFiltersQuery>) => void;
	resetFiltersQuery: () => void;
	displayFilters: {
		from: string | undefined;
		to: string | undefined;
		guest: string | undefined;
		servedBy: string | undefined;
		department: string | undefined;
		status: string | undefined;
		tags: string | undefined;
	};
	removeFilter: (filter: keyof ChatsFiltersQuery) => void;
	hasAppliedFilters: boolean;
	textInputRef: RefObject<HTMLInputElement> | null;
};

export const ChatsContext = createContext<ChatsContextValue>({
	filtersQuery: initialValues,
	setFiltersQuery: () => undefined,
	resetFiltersQuery: () => undefined,
	displayFilters: {
		from: undefined,
		to: undefined,
		guest: undefined,
		servedBy: undefined,
		department: undefined,
		status: undefined,
		tags: undefined,
	},
	removeFilter: () => undefined,
	hasAppliedFilters: false,
	textInputRef: null,
});

export const useChatsContext = (): ChatsContextValue => {
	const context = useContext(ChatsContext);
	if (!context) {
		throw new Error('Must be running in Chats Context');
	}

	return context;
};
