import { createContext, Dispatch, SetStateAction } from 'react';

export type PageContextValue = [
	boolean,
	Dispatch<SetStateAction<boolean>>,
];

const PageContext = createContext<PageContextValue>([false, (): void => undefined]);

export default PageContext;
