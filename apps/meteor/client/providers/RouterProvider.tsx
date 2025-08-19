import { RouterContext } from '@rocket.chat/ui-contexts';
import type { RouterContextValue } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

import { Router } from '../router';

/** @deprecated consume it from the `RouterContext` instead */
export const router: RouterContextValue = new Router();

type RouterProviderProps = {
	children?: ReactNode;
};

const RouterProvider = ({ children }: RouterProviderProps) => <RouterContext.Provider children={children} value={router} />;

export default RouterProvider;
