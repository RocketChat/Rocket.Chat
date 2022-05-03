import React, { ReactElement, useReducer } from 'react';

import { ProductDetailReducer, InitialState } from '../contexts/ProductDetailContext/ProductDetailReducer';
import { DispatchProductGlobalContext, ProductGlobalContext } from '../contexts/ProductDetailContext/GlobalState';

const ProductDetailContextProvider = ({ children }): ReactElement => {
	const [global, dispatch] = useReducer(ProductDetailReducer, InitialState);
	return (
		<DispatchProductGlobalContext.Provider value={{ dispatch }}>
			<ProductGlobalContext.Provider value={global}>{children}</ProductGlobalContext.Provider>
		</DispatchProductGlobalContext.Provider>
	);
};

export default ProductDetailContextProvider;
