import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

type DateListContextValue = {
	list: Set<HTMLElement>;
	dateRef: () => (ref: HTMLElement | null) => void;
};

const DateListContext = createContext<DateListContextValue | undefined>(undefined);

const useDateRef = () => {
	const context = useDateListController();
	return useMemo(() => context.dateRef(), [context]);
};

const DateListProvider = ({ children }: { children: ReactNode }) => {
	const [list] = useState<Set<HTMLElement>>(new Set<HTMLElement>());

	const addToList = (value: HTMLElement) => {
		list.add(value);
		return () => {
			list.delete(value);
		};
	};

	const dateRef = () => {
		let remove: () => void;
		return (ref: HTMLElement | null) => {
			if (remove) remove();

			if (!ref) return;
			remove = addToList(ref);
		};
	};

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
