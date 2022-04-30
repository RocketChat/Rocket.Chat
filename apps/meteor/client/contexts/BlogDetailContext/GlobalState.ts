import { createContext, Dispatch as ReactDispatch } from 'react';

import { InitialState, IActionInterface } from './BlogDetailReducer';

export const GlobalContext = createContext(InitialState);

export const DispatchGlobalContext = createContext<{ dispatch: ReactDispatch<IActionInterface> }>({

	dispatch: () => undefined,
});
