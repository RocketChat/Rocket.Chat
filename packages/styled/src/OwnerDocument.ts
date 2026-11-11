import { createContext, useContext } from 'react';

export const OwnerDocument = createContext<{
	document: Document;
}>({ document: window.document });

export const useOwnerDocument = () => {
	return useContext(OwnerDocument);
};
