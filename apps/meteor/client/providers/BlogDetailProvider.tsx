import React, { ReactElement, useReducer } from 'react';

import { BlogDetailReducer, InitialState } from '../contexts/BlogDetailContext/BlogDetailReducer';
import { DispatchGlobalContext, GlobalContext } from '../contexts/BlogDetailContext/GlobalState';

const BlogDetailContextProvider = ({ children }): ReactElement => {
	const [global, dispatch] = useReducer(BlogDetailReducer, InitialState);
	return (
		<DispatchGlobalContext.Provider value={{ dispatch }}>
			<GlobalContext.Provider value={global}>{children}</GlobalContext.Provider>
		</DispatchGlobalContext.Provider>
	);
};

export default BlogDetailContextProvider;
