import { RouterContext } from '@rocket.chat/ui-contexts';
import { action } from '@storybook/addon-actions';
import type { ContextType, ReactElement, ReactNode } from 'react';
import { useContext, useMemo } from 'react';

const logAction = action('RouterContext');

type RouterContextMockProps = {
	children: ReactNode;
};

const RouterContextMock = ({ children }: RouterContextMockProps): ReactElement => {
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

	return <RouterContext.Provider children={children} value={value} />;
};

export default RouterContextMock;
