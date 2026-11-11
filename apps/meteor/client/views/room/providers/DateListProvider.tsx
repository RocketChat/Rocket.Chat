import type { ReactNode, RefCallback } from 'react';
import { createContext, useContext, useState } from 'react';

type DateListContextValue = {
	list: Set<HTMLElement>;
	dateRef: RefCallback<HTMLElement>;
};

const DateListContext = createContext<DateListContextValue | undefined>(undefined);

const useDateRef = () => useDateListController().dateRef;

export type DateListProviderProps = { children: ReactNode };

const DateListProvider = ({ children }: DateListProviderProps) => {
	const [list] = useState<Set<HTMLElement>>(new Set<HTMLElement>());

	const [dateRef] = useState(() => (node: HTMLElement) => {
		list.add(node);
		return () => {
			list.delete(node);
		};
	});

	return <DateListContext.Provider value={{ list, dateRef }}>{children}</DateListContext.Provider>;
};

const useDateListController = () => {
	const context = useContext(DateListContext);
	if (!context) {
		throw new Error('useDateController must be used within an DateScrollProvider');
	}
	return context;
};

export { DateListProvider, useDateListController, useDateRef };
