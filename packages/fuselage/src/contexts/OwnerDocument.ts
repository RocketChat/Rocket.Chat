import { createContext, useContext } from 'react';

export const OwnerDocument = createContext<{
	document: Document;
	// Build-time evaluation and SSR import this with no `window`
}>({ document: typeof window === 'undefined' ? (undefined as unknown as Document) : window.document });

export const useOwnerDocument = () => {
	return useContext(OwnerDocument);
};
