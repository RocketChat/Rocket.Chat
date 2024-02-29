import React, { createContext, useContext, useState } from 'react';

type DateScrollContextValue = {
	list: Set<HTMLElement>;
	addToList: (value: HTMLElement) => () => void;
};

const DateScrollContext = createContext<DateScrollContextValue | undefined>(undefined);

const DateScrollProvider = ({ children }: { children: React.ReactNode }) => {
	const [list] = useState<Set<HTMLElement>>(new Set<HTMLElement>());

	const addToList = (value: HTMLElement) => {
		list.add(value);
		return () => {
			list.delete(value);
		};
	};

	return <DateScrollContext.Provider value={{ list, addToList }}>{children}</DateScrollContext.Provider>;
};

const useDateController = () => {
	const context = useContext(DateScrollContext);
	if (!context) {
		throw new Error('useDateController must be used within an DateScrollProvider');
	}
	return context;
};

export { DateScrollProvider, useDateController };
