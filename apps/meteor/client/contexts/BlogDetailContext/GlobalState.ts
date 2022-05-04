import { createContext, Dispatch as ReactDispatch } from 'react';

import { InitialState, IActionInterface, IActionCommentInterface } from './BlogDetailReducer';

export const BlogGlobalContext = createContext(InitialState);


export const DispatchBlogGlobalContext = createContext<{ dispatch: ReactDispatch<IActionInterface | IActionCommentInterface | string> }>({

	dispatch: () => undefined,
});
