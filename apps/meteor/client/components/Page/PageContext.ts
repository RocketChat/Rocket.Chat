import type { Dispatch, SetStateAction } from 'react';
import { createContext } from 'react';

type PageContextValue = [boolean, Dispatch<SetStateAction<boolean>>];

const PageContext = createContext<PageContextValue>([false, (): void => undefined]);

export default PageContext;
