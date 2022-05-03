import { createContext, Dispatch as ReactDispatch } from 'react';

import { InitialState, IGameActionInterface } from './GameDetailReducer';

export const GameGlobalContext = createContext(InitialState);

export const DispatchGameGlobalContext = createContext<{ dispatch: ReactDispatch<IGameActionInterface> }>({
	dispatch: () => undefined,
});
