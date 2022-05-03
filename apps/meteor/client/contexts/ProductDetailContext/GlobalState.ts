import { createContext, Dispatch as ReactDispatch } from 'react';

import { InitialState, IProductActionInterface } from './ProductDetailReducer';

export const ProductGlobalContext = createContext(InitialState);

export const DispatchProductGlobalContext = createContext<{ dispatch: ReactDispatch<IProductActionInterface> }>({
	dispatch: () => undefined,
});
