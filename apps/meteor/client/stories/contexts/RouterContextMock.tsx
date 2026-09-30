import type { RouterContextValue } from '@rocket.chat/ui-contexts';
import { RouterContextProvider, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { action } from 'storybook/actions';

const logAction = action('RouterContext');

export type RouterContextMockProps = {
	children: ReactNode;
};

// Ensure Meteor settings are defined
window.__meteor_runtime_config__ = {
	ROOT_URL: 'http://localhost:3000',
	ROOT_URL_PATH_PREFIX: '',
};

const RouterContextMock = ({ children }: RouterContextMockProps) => {
	const parent = useRouter();

	const value = useMemo(
		(): RouterContextValue => ({
			...parent,
			navigate: (...args): void => {
				logAction('navigate', ...args);
			},
		}),
		[parent],
	);

	return <RouterContextProvider value={value}>{children}</RouterContextProvider>;
};

export default RouterContextMock;
