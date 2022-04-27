import React, { useReducer } from 'react';
import { DispatchGlobalContext, GlobalContext } from '../contexts/BlogDetailContext/GlobalState';
import { BlogDetailReducer, InitialState, StateInterface } from '../contexts/BlogDetailContext/BlogDetailReducer';

const BlogDetailContextProvider = ({ children }) => {
	const [global, dispatch] = useReducer(BlogDetailReducer, InitialState);
	return (
		<DispatchGlobalContext.Provider value={{ dispatch }}>
			<GlobalContext.Provider value={global}>{children}</GlobalContext.Provider>
		</DispatchGlobalContext.Provider>
	);
};

export default BlogDetailContextProvider;
