import { createContext, Dispatch as ReactDispatch } from 'react';

import { InitialState, IActionInterface } from './UserPreviousPageReducer';

export const UserPreviousPageContext = createContext(InitialState);

export const DispatchPreviousPageContext = createContext<{ dispatch: ReactDispatch<IActionInterface> }>({
	dispatch: () => undefined,
});
