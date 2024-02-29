import React, { createContext, useContext, useState } from 'react';

type DateListContextValue = {
	list: Set<HTMLElement>;
	addToList: (value: HTMLElement) => () => void;
};

const DateListContext = createContext<DateListContextValue | undefined>(undefined);

const DateListProvider = ({ children }: { children: React.ReactNode }) => {
	const [list] = useState<Set<HTMLElement>>(new Set<HTMLElement>());

	const addToList = (value: HTMLElement) => {
		list.add(value);
		return () => {
			list.delete(value);
		};
	};

	return <DateListContext.Provider value={{ list, addToList }}>{children}</DateListContext.Provider>;
};

const useDateListController = () => {
	const context = useContext(DateListContext);
	if (!context) {
		throw new Error('useDateController must be used within an DateScrollProvider');
	}
	return context;
};

export { DateListProvider, useDateListController };
