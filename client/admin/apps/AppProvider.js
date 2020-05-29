import React, { createContext } from 'react';

import { useAppsData } from './hooks/useAppsData';

export const AppDataContext = createContext();

export default function AppProvider(props) {
	const { data, dataCache } = useAppsData();

	return <AppDataContext.Provider value={{ data, dataCache }} {...props} />;
}
