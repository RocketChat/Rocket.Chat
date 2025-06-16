import type { Dispatch, Reducer, ReactElement } from 'react';
import { createContext, useReducer } from 'react';

import type { initialStateType } from './initialState';

export default function createCtx<ActionType>(
  reducer: Reducer<initialStateType, ActionType>,
  initialState: initialStateType
) {
  const defaultDispatch: Dispatch<ActionType> = () => initialState;
  const context = createContext({
    state: initialState,
    dispatch: defaultDispatch,
  });
  const Provider = (props: { children: ReactElement }) => {
    const [state, dispatch] = useReducer(
      reducer,
      initialState
    );
    return <context.Provider value={{ state, dispatch }} {...props} />;
  };
  return [context, Provider] as const;
}
