import { RouterContext } from '@rocket.chat/ui-contexts';
import type { ContextType, ReactNode } from 'react';
import { useContext, useMemo } from 'react';
import { action } from 'storybook/actions';

const logAction = action('RouterContext');

type RouterContextMockProps = {
	children: ReactNode;
};

// Ensure Meteor settings are defined
window.__meteor_runtime_config__ = {
	ROOT_URL: 'http://localhost:3000',
	ROOT_URL_PATH_PREFIX: '',
};

const RouterContextMock = ({ children }: RouterContextMockProps) => {
	const parent = useContext(RouterContext);

	const value = useMemo(
		(): ContextType<typeof RouterContext> => ({
			...parent,
			navigate: (...args): void => {
				logAction('navigate', ...args);
			},
		}),
		[parent],
	);

	return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

export default RouterContextMock;
