import { createContext, useContext, Dispatch as ReactDispatch } from 'react';

import { InitialState, StateInterface, ActionInterface } from './BlogDetailReducer';

type GlobalContextValue = {
	dispatch: (payload: StateInterface) => void;
};
export const GlobalContext = createContext(InitialState);

export const DispatchGlobalContext = createContext<{ dispatch: ReactDispatch<ActionInterface> }>({
	dispatch: () => undefined,
});
