import { createContext, useContext } from 'react';

export const OwnerDocument = createContext<{
	document: Document;
}>({ document: globalThis.document });

export const useOwnerDocument = () => {
	return useContext(OwnerDocument);
};
