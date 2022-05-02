import React, { ReactElement, useReducer } from 'react';

import { GameDetailReducer, InitialState } from '../contexts/GameDetailContext/GameDetailReducer';
import { DispatchGameGlobalContext, GameGlobalContext } from '../contexts/GameDetailContext/GlobalState';

const GameDetailContextProvider = ({ children }): ReactElement => {
	const [global, dispatch] = useReducer(GameDetailReducer, InitialState);
	return (
		<DispatchGameGlobalContext.Provider value={{ dispatch }}>
			<GameGlobalContext.Provider value={global}>{children}</GameGlobalContext.Provider>
		</DispatchGameGlobalContext.Provider>
	);
};

export default GameDetailContextProvider;
