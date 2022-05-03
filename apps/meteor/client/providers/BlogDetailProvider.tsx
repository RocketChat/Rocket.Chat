import React, { ReactElement, useReducer } from 'react';

import { BlogDetailReducer, InitialState } from '../contexts/BlogDetailContext/BlogDetailReducer';
import { DispatchBlogGlobalContext, BlogGlobalContext } from '../contexts/BlogDetailContext/GlobalState';

const BlogDetailContextProvider = ({ children }): ReactElement => {

	const [global, dispatch] = useReducer(BlogDetailReducer, InitialState);
	return (
		<DispatchBlogGlobalContext.Provider value={{ dispatch }}>
			<BlogGlobalContext.Provider value={global}>{children}</BlogGlobalContext.Provider>
		</DispatchBlogGlobalContext.Provider>
	);
};

export default BlogDetailContextProvider;
